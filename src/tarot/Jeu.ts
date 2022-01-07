import {IData} from '../interfaces/IData';

import {TarotAction, TarotActions} from './actions';
import {TarotCartes} from './cartes';
import {Card} from './enums/Card';
import {CardColor} from './enums/CardColor';

export enum Etats {
    ATTENDANT = 'attendant',
    COUPER = 'Couper',
    DISTRIBUER = 'Distribuer',
    APPELER_ROI = 'AppelerRoi',
    CHIEN_MONTREE = 'chienMontree',
    FAIRE_JEU = 'faireJeu',
    QUI_PREND = 'QuiPrend',
    MONTRE_CARTES = 'montreCartes',
    JEU = 'Jeu',
    FINI = 'Fini',
}

export default class Jeu {
    private static couleurs: { [couleur: string]: number } = {P: 0, K: 1, T: 2, C: 3, A: 4};
    public static cartesType: { [type: string]: number } = {
        1: 0,
        2: 1,
        3: 2,
        4: 3,
        5: 4,
        6: 5,
        7: 6,
        8: 7,
        9: 8,
        10: 9,
        C: 11,
        D: 12,
        R: 13,
        V: 10,
    };

    public static creeNouveauJeu(): Jeu {
        const cartes = [...TarotCartes];
        shuffle(cartes);
        const data: IData = {
            cartes,
            cartesJoueurs: [],
            chat: '',
            chien: [],
            coupDe: null,
            dernierPli: [],
            etat: Etats.ATTENDANT,
            excuseDe: null,
            excusePliFaitPar: null,
            joueurAvecRoi: null,
            pli: [],
            pliFait: [],
            pointsNecessaire: null,
            premierTourDe: 0,
            preneur: null,
            preneurAGagne: null,
            reponsePrisePasse: 0,
            resultat: null,
            roiAppele: null,
            tourDe: 0,
        };
        return new Jeu(data);
    }

    private static ordreCartes(this: void, a: Card, b: Card) {
        if (a === '--' && b === '--') {
            return 0;
        }
        if (a === '--' || a === 'J') {
            return -1;
        } else if (b === '--' || b === 'J') {
            return 1;
        }

        const couleurA = a.substring(0, 1);
        const couleurB = b.substring(0, 1);
        if (couleurA !== couleurB) {
            return Jeu.couleurs[couleurA] - Jeu.couleurs[couleurB];
        } else if (couleurA === 'A') {
            return parseInt(a.substring(1), 10) - parseInt(b.substring(1), 10);
        } else {
            return Jeu.cartesType[a.substring(1)] - Jeu.cartesType[b.substring(1)];
        }
    }

    private static cartePermis(carte: Card, pli: Card[], cartes: Card[]) {
        if (carte === 'J') {
            return true;
        }
        let couleurMettre: CardColor | null = null;
        let hautAtout: number | null = null;
        pli.forEach(c => {
            const couleur = c.substring(0, 1);
            if (couleur !== 'J') {
                if (couleurMettre == null) {
                    couleurMettre = couleur;
                }
                if (couleur === 'A') {
                    const atout = parseInt(c.substring(1), 10);
                    if (hautAtout === null || hautAtout < atout) {
                        hautAtout = atout;
                    }
                }
            }
        });

        if (couleurMettre == null) {
            return true;
        }

        const carteCouleur = carte.substring(0, 1);
        if (carteCouleur === couleurMettre) {
            if (couleurMettre === 'A' && hautAtout !== null) {
                const atout = parseInt(carte.substr(1), 10);
                if (atout < hautAtout) {
                    for (const c of cartes) {
                        if (c.substring(0, 1) === 'A' && parseInt(c.substr(1), 10) > hautAtout) {
                            return false;
                        }
                    }
                }
            }
            return true;
        }

        for (const c of cartes) {
            if (c.substr(0, 1) === couleurMettre) {
                return false;
            }
        }

        if (couleurMettre !== 'A') {
            if (carteCouleur === 'A' && hautAtout) {
                const atout = parseInt(carte.substr(1), 10);
                if (atout < hautAtout) {
                    for (const c of cartes) {
                        if (c.substring(0, 1) === 'A' && parseInt(c.substr(1), 10) > hautAtout) {
                            return false;
                        }
                    }
                }
            }
        } else {
            for (const c of cartes) {
                if (c.substr(0, 1) === 'A') {
                    return false;
                }
            }
        }
        return true;
    }

    private static quiGagnePli(pli: Card[]) {
        let pliPour = 0;
        let carteHaute: Card | null = null;
        pli.forEach((c, i) => {
            const couleur = c.substring(0, 1);
            if (couleur !== 'J') {
                if (carteHaute == null) {
                    carteHaute = c;
                    pliPour = i;
                } else {
                    if (carteHaute.substring(0, 1) === 'A') {
                        if (c.substring(0, 1) === 'A') {
                            const atout = parseInt(c.substring(1), 10);
                            const atoutHaute = parseInt(carteHaute.substring(1), 10);
                            if (atout > atoutHaute) {
                                carteHaute = c;
                                pliPour = i;
                            }
                        }
                    } else {
                        if (c.substring(0, 1) === 'A') {
                            carteHaute = c;
                            pliPour = i;
                        } else if (c.substring(0, 1) === carteHaute.substring(0, 1)) {
                            if (Jeu.cartesType[c.substring(1)] > Jeu.cartesType[carteHaute.substring(1)]) {
                                carteHaute = c;
                                pliPour = i;
                            }
                        }
                    }
                }
            }
        });
        return pliPour;
    }

    private static compteCartes(cartes: Card[]) {
        return cartes.reduce((count, c) => count + Jeu.pointsCarte(c), 0);
    }

    private static pointsCarte(carte: Card) {
        if (carte === 'J') {
            return 4.5;
        }
        const couleur = carte.substring(0, 1);
        const type = carte.substring(1);
        if (couleur === 'A') {
            if (type === '1' || type === '21') {
                return 4.5;
            }
            return .5;
        }
        switch (type) {
            case 'R':
                return 4.5;
            case 'D':
                return 3.5;
            case 'C':
                return 2.5;
            case 'V':
                return 1.5;
            default:
                return .5;
        }
    }

    private static pointsNecessaire(cartes: Card[]) {
        const points = [56, 51, 41, 31];
        const bouts = cartes.reduce((count, c) => {
            switch (c) {
                case 'A1':
                    return count + 1;
                case 'A21':
                    return count + 1;
                case 'J':
                    return count + 1;
                default:
                    return count;
            }
        }, 0);
        return points[bouts];
    }

    private static nombrePourChien(joueurs: number) {
        if (joueurs === 5) {
            return 3;
        } else {
            return 6;
        }
    }

    constructor(public data: IData, public guids: string[]=[]) {
    }

    public commenceJeu() {
        const premierTourDe = Math.floor(Math.random() * this.guids.length);
        this.data.tourDe = premierTourDe;
        this.data.premierTourDe = premierTourDe;
        this.data.etat = Etats.FINI;
        this.prochainJeu();
    }

    public prochainJeu() {
        if (this.data.etat !== Etats.FINI) {
            return;
        }
        this.data.etat = Etats.COUPER;
        this.data.premierTourDe = (this.data.premierTourDe + 1) % this.guids.length;
        this.data.tourDe = this.data.premierTourDe;
        this.data.coupDe = (this.data.tourDe + this.guids.length - 2) % this.guids.length;
        this.data.reponsePrisePasse = 0;

        this.data.cartes = this.data.cartes.concat(this.data.chien, ...this.data.cartesJoueurs, ...this.data.pliFait);
        this.data.chien = [];

        for (let i = 0; i < this.guids.length; i++) {
            this.data.cartesJoueurs[i] = [];
            this.data.pliFait[i] = [];
        }

        this.data.preneur = null;
        this.data.roiAppele = null;
        this.data.joueurAvecRoi = null;
        this.data.pli = [];
        this.data.dernierPli = [];
        this.data.excuseDe = null;
        this.data.excusePliFaitPar = null;
        this.data.resultat = null;
        this.data.pointsNecessaire = null;
        this.data.preneurAGagne = null;
    }

    private coupe(qui: number, nombre: number) {
        if (this.data.etat !== Etats.COUPER || qui !== this.data.tourDe) {
            // TODO error
            return;
        }
        this.data.cartes = this.data.cartes.slice(nombre).concat(this.data.cartes.slice(0, nombre));
        this.data.coupDe = null;

        this.data.etat = Etats.DISTRIBUER;
    }

    private jePrendsPasse(qui: number, prends: boolean, callback: () => void) {
        if (this.data.etat !== Etats.QUI_PREND || qui !== this.data.tourDe) {
            // TODO error
            return;
        }
        if (prends) {
            this.data.preneur = qui;
        }
        this.data.reponsePrisePasse += 1;
        if (this.data.reponsePrisePasse === this.guids.length) {
            if (this.data.preneur == null) {
                this.data.etat = Etats.FINI;
                this.prochainJeu();
                callback();
                return;
            } else {
                this.data.cartesJoueurs.forEach(cartes => cartes.sort(Jeu.ordreCartes));
                if (this.guids.length === 5) {
                    this.data.etat = Etats.APPELER_ROI;
                } else {
                    this.montreChien(callback);
                }
            }
        }
        this.data.tourDe = (this.data.tourDe + 1) % this.guids.length;
        callback();
    }

    private montreChien(callback: () => void) {
        this.data.etat = Etats.CHIEN_MONTREE;
        setTimeout(() => {
            if (this.data.preneur === null) {
                console.warn('MontreChien error: Preneur is not set');
                return;
            }
            this.data.cartesJoueurs[this.data.preneur] = this.data.cartesJoueurs[this.data.preneur].concat(
                this.data.chien);
            this.data.cartesJoueurs[this.data.preneur].sort(Jeu.ordreCartes);
            this.data.chien = [];
            this.data.etat = Etats.FAIRE_JEU;
            callback();
        }, 7000);
    }

    private carteClick(qui: number, carte: Card, callback: () => void) {
        if (this.data.etat === Etats.FAIRE_JEU) {
            this.faireJeu(qui, carte);
        } else if (this.data.etat === Etats.JEU) {
            this.joueCarte(qui, carte, callback);
        } else if (this.data.etat === Etats.APPELER_ROI && this.data.preneur === qui) {
            if (['PR', 'TR', 'CR', 'KR'].indexOf(carte) !== -1) {
                this.data.roiAppele = carte;
                this.montreChien(callback);
            }
        } else {
            // TODO error
        }
        callback();
    }

    private faireJeu(qui: number, carte: Card) {
        if (this.data.etat !== Etats.FAIRE_JEU || qui !== this.data.preneur) {
            // TODO error
            return;
        }
        if (carte.substring(0, 1) === 'A' || carte.substring(1) === 'R') {
            // TODO what does this check do?
            return;
        }
        const dansCarte = this.data.cartesJoueurs[qui].findIndex(c => c === carte);
        if (dansCarte !== -1) {
            this.data.cartesJoueurs[qui].splice(dansCarte, 1);
            this.data.pli.push(carte);
        } else {
            const dansEcart = this.data.pli.findIndex(c => c === carte);
            if (dansEcart !== -1) {
                this.data.pli.splice(dansEcart, 1);
                this.data.cartesJoueurs[qui].push(carte);
                this.data.cartesJoueurs[qui].sort(Jeu.ordreCartes);
            }
        }
    }

    private finiFaireJeu(qui: number) {
        if (this.data.etat !== Etats.FAIRE_JEU ||
            qui !== this.data.preneur ||
            this.data.pli.length !== Jeu.nombrePourChien(this.guids.length)) {
            // TODO error
            return;
        }
        this.data.pliFait[qui] = this.data.pli;
        this.data.pli = [];

        this.data.etat = Etats.JEU;
    }

    private joueCarte(qui: number, carte: Card, callback: () => void) {
        if (this.data.etat !== Etats.JEU || qui !== this.data.tourDe) {
            // TODO error
            return;
        }
        const carteIndex = this.data.cartesJoueurs[qui].findIndex(c => c === carte);
        if (carteIndex === -1) {
            // TODO error
            return;
        }

        if (!Jeu.cartePermis(carte, this.data.pli, this.data.cartesJoueurs[qui])) {
            // TODO error
            return;
        }

        if (carte === this.data.roiAppele) {
            this.data.joueurAvecRoi = qui;
        }

        this.data.cartesJoueurs[qui].splice(carteIndex, 1);
        this.data.pli.push(carte);
        this.data.tourDe = (this.data.tourDe + 1) % this.guids.length;

        if (this.data.pli.length === this.guids.length) {
            this.data.etat = Etats.MONTRE_CARTES;
            setTimeout(() => {
                this.data.dernierPli = this.data.pli.slice();
                this.data.etat = Etats.JEU;

                const pourQui = (this.data.tourDe + Jeu.quiGagnePli(this.data.pli)) % this.guids.length;
                const excuseIndex = this.data.pli.findIndex(c => c === 'J');
                if (excuseIndex !== -1) {
                    const excuseDe = (this.data.tourDe + excuseIndex) % this.guids.length;
                    if (this.isTeamPreneur(excuseDe) !== this.isTeamPreneur(pourQui)) {
                        this.data.pliFait[excuseDe] = this.data.pliFait[excuseDe].concat(
                            this.data.pli.splice(excuseIndex, 1));
                        this.data.excuseDe = excuseDe;
                        this.data.excusePliFaitPar = pourQui;
                    }
                }

                this.data.pliFait[pourQui] = this.data.pliFait[pourQui].concat(this.data.pli);
                this.data.pli = [];
                this.data.tourDe = pourQui;

                this.essayDonnerCartePourExcuse();

                if (this.data.cartesJoueurs[0].length === 0 && this.data.preneur !== null) {
                    this.data.etat = Etats.FINI;
                    this.data.resultat = this.data.pliFait.map(pli => Jeu.compteCartes(pli));
                    const cartesPreneur = this.data.joueurAvecRoi === null ?
                        this.data.pliFait[this.data.preneur] :
                        this.data.pliFait[this.data.preneur].concat(this.data.pliFait[this.data.joueurAvecRoi]);
                    this.data.pointsNecessaire = Jeu.pointsNecessaire(cartesPreneur);
                    this.data.preneurAGagne = Jeu.compteCartes(cartesPreneur) > this.data.pointsNecessaire;
                }
                callback();
            }, 3000);
        }
    }

    private isTeamPreneur(i: number|null) {
        if (this.guids.length === 5) {
            return (i === this.data.preneur || i === this.data.joueurAvecRoi);
        } else {
            return i === this.data.preneur;
        }
    }

    private essayDonnerCartePourExcuse() {
        if (this.data.excuseDe === null || this.data.excusePliFaitPar === null) {
            return;
        }
        const de = this.data.pliFait.filter(
            (cartes, i) => {
                if (this.isTeamPreneur(this.data.excuseDe)) {
                    return this.isTeamPreneur(i);
                } else {
                    return !this.isTeamPreneur(i);
                }
            });
        for (const cartes of de) {
            const index = cartes.findIndex(c => Jeu.pointsCarte(c) === .5);
            if (index !== -1) {
                this.data.pliFait[this.data.excusePliFaitPar] = this.data.pliFait[this.data.excusePliFaitPar].concat(
                    cartes.splice(index, 1));
                this.data.excuseDe = null;
                this.data.excusePliFaitPar = null;
                return;
            }
        }
    }

    private distribue(stepCallback: () => void) {
        const dos = (prochain: number) => {
            if (this.data.cartes.length <= 0) {
                this.data.etat = Etats.QUI_PREND;
                stepCallback();
                return;
            }
            this.data.cartesJoueurs[prochain] = this.data.cartesJoueurs[prochain].concat(this.data.cartes.slice(0, 3));
            this.data.cartes = this.data.cartes.slice(3);

            stepCallback();

            const cartesManquantChien = Jeu.nombrePourChien(this.guids.length) - this.data.chien.length;
            if (this.data.cartes.length - 3 - cartesManquantChien === 0) {// pas les trois dernières cartes
                this.data.chien = this.data.chien.concat(this.data.cartes.slice(0, cartesManquantChien));
                this.data.cartes = this.data.cartes.slice(cartesManquantChien);
                stepCallback();
            } else if (cartesManquantChien > 0 && Math.random() < .4) {
                this.data.chien = this.data.chien.concat(this.data.cartes[0]);
                this.data.cartes = this.data.cartes.slice(1);
                stepCallback();
            }
            setTimeout(() => dos((prochain + 1) % this.guids.length), 100);
        };
        dos(this.data.tourDe);
    }

    public anonymize(qui: number): IData {
        let chien = this.data.chien;
        if (this.data.etat !== Etats.CHIEN_MONTREE) {
            chien = chien.map(() => '--');
        }
        let pli = this.data.pli;
        if (this.data.etat === Etats.FAIRE_JEU && this.data.preneur !== qui) {
            pli = pli.map(() => '--');
        }
        const cartesJoueurs = this.data.cartesJoueurs.map((cartes, i) => {
            if (i === qui) {
                return cartes;
            } else {
                return cartes.map(() => '--');
            }
        });
        let pliFait = this.data.pliFait;
        if (this.data.dernierPli.length === 0) {
            pliFait = pliFait.map(
                (cartes, i) => this.data.preneur !== i || qui !== i ? cartes.map(() => '--') : cartes);
        } else {
            pliFait = pliFait.map(
                cartes => cartes.map(c => this.data.dernierPli.findIndex(pc => pc === c) === -1 ? '--' : c));
        }
        const cartesCachés = this.data.cartes.map(() => '--');
        return {...this.data, pli, cartes: cartesCachés, chien, cartesJoueurs, pliFait};
    }

    public action(m: TarotAction, qui: number, sendToAll: () => void) {
        switch (m.type) {
            case TarotActions.COUPE:
                this.coupe(qui, m.nombre);
                sendToAll();
                this.distribue(sendToAll);
                break;
            case TarotActions.PRENDS_PASSE:
                this.jePrendsPasse(qui, m.prends, sendToAll);
                break;
            case TarotActions.CARTE_CLICK:
                this.carteClick(qui, m.carte, sendToAll);
                break;
            case TarotActions.FINI_FAIRE_JEU:
                this.finiFaireJeu(qui);
                sendToAll();
                break;
        }
    }
}

function shuffle(a: Card[]) {
    for (let i = a.length; i; i -= 1) {
        const j = Math.floor(Math.random() * i);
        const x = a[i - 1];
        a[i - 1] = a[j];
        a[j] = x;
    }
}
