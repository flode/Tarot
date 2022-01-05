import React from 'react';

import {ResponseJeu} from '../../datastructure/responses';
import Nom from '../../views/Nom';
import {TarotAction, TarotActions} from '../actions';
import {Etats} from '../Jeu';

import CardStack from './CardStack';

export interface ITableProps {
    jeu: ResponseJeu;
    moi: number;
    onAction: (data: TarotAction) => void;
}

export default class Table extends React.Component<ITableProps> {
    public state = {
        couperA: 0,
    };

    public render() {
        const jeu = this.props.jeu;
        const cartes = jeu.cartesJoueurs.map((cartesJoueur, i) => {
            if (i === this.props.moi) {
                return <span key={i}/>;
            }
            return <div key={i} className="stackinline">
                Joueur <Nom nom={jeu.nomJoueurs[i]}/>:{' '}
                <CardStack className="smallstack" cartes={cartesJoueur}/>
            </div>;
        });

        const plisFait = jeu.pliFait.map((pli, i) => {
            if (pli.length > 0) {
                return <div key={i} className="stackinline">
                    Plis joueur <Nom nom={jeu.nomJoueurs[i]}/>:{' '}
                    <CardStack className="smallstack" cartes={pli}/>
                </div>;
            } else {
                return <div key={i}/>;
            }
        });

        let status;
        if (jeu.etat === Etats.JEU) {
            if (jeu.tourDe === this.props.moi) {
                status = <b>Choisi une de tes cartes!</b>;
            } else {
                status = <span>C’est le tour de joueur <Nom nom={jeu.nomJoueurs[jeu.tourDe]}/>. </span>;
            }
        } else if (jeu.etat === Etats.COUPER) {
            if (jeu.coupDe === this.props.moi) {
                status = <b>Choisi le nombre de carte que tu veux couper!</b>;
            } else if (jeu.coupDe !== null) {
                status = <span>C’est à <Nom nom={jeu.nomJoueurs[jeu.coupDe]}/> de couper. </span>;
            }
        } else if (jeu.etat === Etats.QUI_PREND) {
            if (jeu.tourDe === this.props.moi) {
                status = <b>Est-ce que tu veux prendre?</b>;
            } else {
                status = <span>C’est au joueur <Nom nom={jeu.nomJoueurs[jeu.tourDe]}/> à décider. </span>;
            }
        } else if (jeu.etat === Etats.APPELER_ROI) {
            if (jeu.preneur === this.props.moi) {
                status = <b>Appelle un roi!</b>;
            } else if (jeu.preneur !== null) {
                status = <span>C’est à <Nom nom={jeu.nomJoueurs[jeu.preneur]}/> de choisir un roi. </span>;
            }
        }

        const colorToName: { [key: string]: string } = {PR: 'pique', KR: 'carreau', TR: 'trèfle', CR: 'cœur'};
        return <div>
            Tu es le joueur <Nom nom={jeu.nomJoueurs[this.props.moi]}/><br/>
            {jeu.preneur !== null ? <span>Joueur <Nom nom={jeu.nomJoueurs[jeu.preneur]}/> a pris. </span> : ''}
            {jeu.roiAppele !== null ? ' Il a appele le roi de ' + colorToName[jeu.roiAppele] + '. ' : ''}
            <br/>
            <br/>
            {status}
            {(jeu.etat === Etats.COUPER && jeu.coupDe === this.props.moi) ?
                <form onSubmit={e => {
                    e.preventDefault();
                    this.props.onAction(TarotActions.makeCoupe(this.state.couperA));
                }}>
                    <input type="text" value={this.state.couperA} onChange={e => this.setState(
                        {couperA: Math.min(jeu.cartes.length, Math.max(0, Number(e.target.value)))})}/>
                    <input type="submit" value="Couper"/>
                </form>
                : ''}
            <CardStack className="smalleststack" cartes={jeu.cartes}/>
            {jeu.etat === Etats.QUI_PREND && jeu.tourDe === this.props.moi ?
                <div>
                    <input type="button" value="Je prends" onClick={() => this.props.onAction(TarotActions.makePrendsPasse(true))}/>
                    <input type="button" value="Je passe" onClick={() => this.props.onAction(TarotActions.makePrendsPasse(false))}/>
                </div>
                : ''}
            {jeu.etat === Etats.FAIRE_JEU && jeu.preneur === this.props.moi ?
                <input type="button" value="Fini faire mon jeu" onClick={() => this.props.onAction(TarotActions.makeFiniFaireJeu())}/>
                : ''}
            <br/>
            <br/>
            <div>
                L’écart:
                <CardStack className="stack" cartes={jeu.pli} onClick={card => this.props.onAction(TarotActions.makeCarteClick(card))}/>
                {jeu.etat !== Etats.FAIRE_JEU ?
                    <Nom nom={jeu.pli.map(
                        (p, i) => jeu.nomJoueurs[(jeu.tourDe + jeu.nomJoueurs.length - (jeu.pli.length) + i) % jeu.nomJoueurs.length])}/>
                    : ''}
            </div>
            <br/>
            {jeu.etat === Etats.APPELER_ROI ?
                <CardStack cartes={['PR', 'KR', 'TR', 'CR']} onClick={card => this.props.onAction(TarotActions.makeCarteClick(card))}/>
                : ''}
            {jeu.chien.length !== 0 ?
                <div>
                    Le chien:
                    <CardStack cartes={jeu.chien} onClick={card => this.props.onAction(TarotActions.makeCarteClick(card))}/>
                </div>
                : ''}
            <div>
                Mes cartes:
                <CardStack className="stack" cartes={jeu.cartesJoueurs[this.props.moi]}
                           onClick={card => this.props.onAction(TarotActions.makeCarteClick(card))}/>
            </div>
            {cartes}
            <br/>
            {plisFait}
            {jeu.resultat !== null && jeu.preneur !== null ?
                <div>
                    {jeu.resultat.map((r, i) => <div key={i}><Nom nom={jeu.nomJoueurs[i]}/>: {r}</div>)}
                    Le preneur <Nom nom={jeu.nomJoueurs[jeu.preneur]}/> a besoin de {jeu.pointsNecessaire}.<br/>
                    {jeu.preneurAGagne ? 'Le preneur a gagné.' : 'Le preneur a perdu.'}
                </div>
                : []}
        </div>;
    }
}
