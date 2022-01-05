import {readFile, writeFile} from 'fs';

import {connection as WebsocketConnection} from 'websocket';

import {Action, Actions} from '../datastructure/actions';
import {ServerResponses} from '../datastructure/responses';
import {IData} from '../interfaces/IData';
import Jeu, {Etats} from '../tarot/Jeu';

interface ISavedGame {
    jeux: { jeuData: IData|null; guids: string[] }[];
    known_guids: { [guid: string]: { jeuId: number; nom: string } };
    chat_attendant: string;
}

const jeux: (Jeu|null)[] = [];

let knownGuids: { [guid: string]: { jeu: Jeu | null; nom: string; connection: WebsocketConnection | null } } = {};

let chatAttendant = '';

export function save(file: string, callback: () => void) {
    const savedKnownGuids: ISavedGame['known_guids'] = {};
    for (const guid in knownGuids) {
        if (Object.prototype.hasOwnProperty.call(knownGuids, guid)) {
            const jeuId = jeux.findIndex(j => j === knownGuids[guid].jeu);
            savedKnownGuids[guid] = {
                jeuId,
                nom: knownGuids[guid].nom,
            };
        }
    }
    const data: ISavedGame = {
        chat_attendant: chatAttendant,
        jeux: jeux.map(jeu => ({jeuData: (jeu ? jeu.data : null), guids: (jeu ? jeu.guids : [])})),
        known_guids: savedKnownGuids,
    };
    writeFile(file, JSON.stringify(data), err => {
        if (err) {
            throw err;
        }
        if (callback) {
            callback();
        }
    });
}

export function open(file: string, callback?: () => void) {
    readFile(file, (err, content) => {
        if (!err) {
            const data = JSON.parse(content.toString()) as ISavedGame;
            data.jeux.forEach(({jeuData, guids}) => jeux.push(jeuData ? new Jeu(jeuData, guids) : null));
            const loadedKnownGuids: typeof knownGuids = {};
            for (const guid in data.known_guids) {
                if (Object.prototype.hasOwnProperty.call(data.known_guids, guid)) {
                    loadedKnownGuids[guid] = {
                        jeu: jeux[data.known_guids[guid].jeuId],
                        nom: data.known_guids[guid].nom,
                        connection: null,
                    };
                }
            }
            knownGuids = loadedKnownGuids;
            chatAttendant = data.chat_attendant;
        }
        if (callback) {
            callback();
        }
    });
}

export function createActionHandler(connection: WebsocketConnection) {
    let jeu: Jeu | null = null;
    let guid: string | null = null;
    return (m: Action) => {
        switch (m.type) {
            case Actions.JOINDRE: {
                const newGuid = m.guid;
                knownGuids[newGuid] = {connection, nom: m.nomJoueur, jeu: null};
                guid = newGuid;
                envoieTousAttendant();
                break;
            }
            case Actions.REJOINDRE: {
                if (m.guid in knownGuids) {
                    guid = m.guid;
                    knownGuids[guid].connection = connection;
                    jeu = knownGuids[guid].jeu;
                    if (jeu) {
                        connection.sendUTF(JSON.stringify(ServerResponses.makeRejoindu()));
                        sendToAll(jeu);
                    } else {
                        envoieTousAttendant();
                    }
                } else {
                    sendPasDeJoueurs(connection);
                    return;
                }
                break;
            }
            case Actions.CREER_JEU: {
                const newJeu = Jeu.creeNouveauJeu();
                jeux.push(newJeu);
                envoieTousAttendant();
                break;
            }
            case Actions.QUITTER: {
                if (guid && guid in knownGuids) {
                    delete knownGuids[guid];
                    envoieTousAttendant();
                    sendPasDeJoueurs(connection);
                }
                break;
            }
            case Actions.JOINDRE_JEU: {
                if (!guid || !(guid in knownGuids)) {
                    return;
                }
                const prochainJeu = jeux[m.jeuId];
                if ((!prochainJeu) || prochainJeu.data.etat !== Etats.ATTENDANT) {
                    console.warn('game does not exist or has already started');
                    return;
                }
                if (prochainJeu.guids.length >= 5) {
                    console.warn('too many players');
                    // TODO error
                    return;
                }
                const myGuid: string = guid;
                if (prochainJeu.guids.find(g => knownGuids[g].nom === knownGuids[myGuid].nom) !== undefined) {
                    console.warn('player name already exists');
                    // TODO error
                    return;
                }
                jeu = prochainJeu;
                jeu.guids.push(guid);
                jeu.data.chat = getChatMessage(null, knownGuids[guid].nom + ' a joint!') + jeu.data.chat;
                knownGuids[guid].jeu = jeu;
                envoieTousAttendant();
                sendToAll(jeu);
                break;
            }
            case Actions.START:
                if (!jeu) {
                    console.warn('Action non permis, jeu pas commencé');
                    return;
                }
                if (jeu.guids.length < 3) {
                    console.warn('not enough player');
                    // TODO error
                    return;
                }
                jeu.commenceJeu();
                envoieTousAttendant();
                sendToAll(jeu);
                break;
            case Actions.ACTION: {
                if (!jeu) {
                    console.warn('Action non permis, jeu pas commencé');
                    return;
                }
                jeu.action(m.data, numeroJoueur(), () => {
                    if (!jeu) {
                        return;
                    }
                    sendToAll(jeu);
                });
                break;
            }
            case Actions.QUITTER_JEU: {
                const myGuid = guid;
                if (jeu && myGuid) {
                    if (jeu.data.etat === Etats.ATTENDANT) {
                        const index = jeu.guids.findIndex(g => g === myGuid);
                        if (index === -1) return;
                        jeu.guids.splice(index, 1);
                        jeu.data.chat = getChatMessage(null, knownGuids[myGuid].nom + ' a quitté!') + jeu.data.chat;
                        sendToAll(jeu);
                    } else {
                        const jeuId = jeux.findIndex(j => j === knownGuids[myGuid].jeu);
                        jeux[jeuId] = null;
                        jeu.guids.forEach(g => knownGuids[g].jeu = null);
                    }
                    knownGuids[myGuid].jeu = null;
                    jeu = null;
                    envoieTousAttendant();
                }
                break;
            }
            case Actions.PROCHAIN_JEU:
                if (jeu) {
                    jeu.prochainJeu();
                    sendToAll(jeu);
                }
                break;
            case Actions.SEND_MESSAGE:
                if (!guid || !(guid in knownGuids)) {
                    return;
                }
                if (jeu !== null) {
                    jeu.data.chat = getChatMessage(knownGuids[guid].nom, m.message) + jeu.data.chat;
                    sendToAll(jeu);
                } else {
                    chatAttendant = getChatMessage(knownGuids[guid].nom, m.message) + chatAttendant;
                    envoieTousAttendant();
                }
                break;
        }
    };

    function getChatMessage(name: string|null, message: string) {
        return new Date().toTimeString().substring(0, 8) + ' '+ (name ? name + ': ': '') +
            message.substring(0, 100).replace(/\n/g, ' ') + '\n';
    }

    function numeroJoueur() {
        if (!jeu || !jeu.data) return -1;
        return jeu.guids.findIndex(g => g===guid);
    }
}

function sendPasDeJoueurs(con: WebsocketConnection) {
    con.sendUTF(JSON.stringify(ServerResponses.makeJoueurJoint(null, [], '')));
}

function envoieTousAttendant() {
    const nomJoueurs = Object.values(knownGuids).filter(g => !g.jeu).map(g=>g.nom);
    const jeu = jeux
        .map((j,i) => {return {jeu: j, i};})
        .filter(j => j.jeu)
        .map(j => {
            return {jeuId: j.i, active: j.jeu?.data.etat!==Etats.ATTENDANT, joueurs: (j.jeu ? j.jeu.guids.map(g=>knownGuids[g].nom) : [])};
        });
    Object.values(knownGuids)
        .filter(g => !g.jeu)
        .forEach(g => g.connection?.sendUTF(JSON.stringify(ServerResponses.makeJoueurJoint(nomJoueurs, jeu, chatAttendant))));
}

export function sendToAll(jeu: Jeu) {
    jeu.guids.forEach(guid => {
        const moi = jeu.guids.findIndex(g => g === guid);
        const data = {...jeu.anonymize(moi), nomJoueurs: jeu.guids.map(g=> knownGuids[g].nom)};
        knownGuids[guid].connection?.sendUTF(JSON.stringify(ServerResponses.makeJeu(data, moi)));
    });
}
