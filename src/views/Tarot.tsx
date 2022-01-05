import React from 'react';
import {v4 as uuidv4} from 'uuid';
import websocket from 'websocket';

import {Actions} from '../datastructure/actions';
import {ResponseJeu, ServerResponse, ServerResponses} from '../datastructure/responses';
import {Etats} from '../tarot/Jeu';
import Table from '../tarot/views/Table';

import Chat from './Chat';
import Nom from './Nom';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const w3cwebsocket = (websocket as any as {w3cwebsocket: typeof WebSocket}).w3cwebsocket;

interface ITarotState {
    chat_attendant: string;
    client: WebSocket | null;
    guid: string;
    jeu: ResponseJeu | null;
    joueurs: string[] | null;
    moi: number | null;
    nomJoueur: string;
    jeux: {jeuId: number; active: boolean; joueurs: string[]}[];
}

export default class Tarot extends React.Component<object, ITarotState> {
    public state: ITarotState = {
        chat_attendant: '',
        client: null,
        guid: '',
        jeu: null,
        joueurs: null,
        moi: null,
        nomJoueur: '',
        jeux: [],
    };

    public componentWillMount() {
        const nomJoueur = localStorage.getItem('nomJoueur');
        if (nomJoueur) {
            this.setState({nomJoueur});
        }
        let guid;
        const guidItem = localStorage.getItem('guid');
        if (guidItem !== null) {
            guid = guidItem;
        } else {
            guid = uuidv4();
            localStorage.setItem('guid', guid);
        }

        this.setState({guid});
    }

    public componentDidMount() {
        this.connectWebsocket();
    }

    public connectWebsocket() {
        const client = new w3cwebsocket((location.protocol === 'http:' ? 'ws://' : 'wss://') + location.hostname +
            (location.port ? ':' + location.port : '') + '/tarot/ws/', 'tarot-protocol');

        client.onerror = () => {
            console.error('Connection Error');
            setTimeout(() => this.connectWebsocket(), 60000);
        };

        client.onopen = () => {
            console.debug('WebSocket Client Connected');
            if (client.readyState === client.OPEN) {
                client.send(JSON.stringify(Actions.makeRejoindre(this.state.guid)));
                this.setState({client});
            }
        };

        client.onclose = () => {
            console.debug('tarot-protocol Client Closed');
            setTimeout(() => this.connectWebsocket(), 6000);
        };

        client.onmessage = e => {
            if (typeof e.data === 'string') {
                const m = JSON.parse(e.data) as  ServerResponse;
                console.debug(m);
                switch (m.type) {
                    case ServerResponses.JEU:
                        this.setState({jeu: m.jeu, moi: m.moi});
                        break;
                    case ServerResponses.JOUEUR_JOINT: {
                        this.setState({joueurs: m.joueurs, jeux: m.jeux, chat_attendant: m.chat_attendant, jeu: null, moi: -1});
                        break;
                    }
                    case ServerResponses.REJOINDU: {
                        break;
                    }
                }
            }
        };
    }

    public componentDidUpdate(prevProps: never, prevState: ITarotState) {
        if (prevState.jeu === null && this.state.jeu === null) {
            if (this.state.chat_attendant !== prevState.chat_attendant) {
                notifyUser('Nouveau chat!', 'blop');
            }
        } else if (this.state.jeu !== null && prevState.jeu !== null) {
            if (prevState.jeu.etat === Etats.ATTENDANT && this.state.jeu.etat !== Etats.ATTENDANT) {
                notifyUser('Le jeu a commencé!', 'ding');
            } else {
                const moi = this.state.moi;
                if (moi !== null && cestAmoi(this.state.jeu, moi) && !cestAmoi(prevState.jeu, moi)) {
                    notifyUser('C’est à toi!', 'ding');
                } else if (this.state.jeu.chat !== prevState.jeu.chat) {
                    notifyUser('Nouveau chat!', 'blop');
                }
            }
        }
        function cestAmoi(jeu: ResponseJeu, moi: number) {
            return (jeu.etat === Etats.JEU && jeu.tourDe === moi) ||
                (jeu.etat === Etats.COUPER && jeu.coupDe === moi) ||
                (jeu.etat === Etats.QUI_PREND && jeu.tourDe === moi) ||
                (jeu.etat === Etats.APPELER_ROI && jeu.preneur === moi);
        }
    }

    public render() {
        const {client} = this.state;
        if (client == null || client.readyState !== client.OPEN) {
            return <span>Waiting for server...</span>;
        }
        if (this.state.jeu == null || this.state.moi === null) {
            if (this.state.joueurs == null) {
                return <form onSubmit={e => {
                    e.preventDefault();
                    client.send(JSON.stringify(Actions.makeJoindre(this.state.guid, this.state.nomJoueur)));
                }}>
                    <input type="text" value={this.state.nomJoueur} placeholder="Nom" onChange={e => {
                        this.setState({nomJoueur: e.target.value});
                        localStorage.setItem('nomJoueur', e.target.value);
                    }}/>
                    <input type="submit" value="Joindre"/>
                </form>;
            } else {
                return <div>
                    {this.state.joueurs.length} {this.state.joueurs.length === 1 ? 'joueur attend' : 'joueurs attendent'}:{' '}
                    <Nom nom={this.state.joueurs}/><br/>
                    <input type="button" value="Quitter"
                           onClick={() => client.send(JSON.stringify(Actions.makeQuitter()))}/>
                    <div><input type="button" value="Nouveau table"
                        onClick={() => client.send(JSON.stringify(Actions.makeCreerJeu()))}/></div>
                    {this.state.jeux.reverse().map(jeu => <div className={'table ' + (jeu.active ? 'active' : 'joinable')} key={jeu.jeuId}>
                        <ul>
                            {jeu.joueurs.map((joueur,i) => <li key={i}>{joueur}</li>)}
                        </ul>
                        {(!jeu.active) ? <input type="button" value="Joindre ce jeu"
                               onClick={() => client.send(JSON.stringify(Actions.makeJoindreJeu(jeu.jeuId)))}/> : ''}
                    </div>)}
                    <Chat chat={this.state.chat_attendant}
                          onSubmit={message => client.send(JSON.stringify(Actions.makeSendMessage(message)))}/>
                </div>;
            }
        }

        return <div>
            <Table jeu={this.state.jeu}
                   moi={this.state.moi}
                   onAction={data => client.send(JSON.stringify((Actions.makeAction(data))))}
            />
            {this.state.jeu.etat === Etats.ATTENDANT ? <input type="button" value="Commencer le jeu"
                   onClick={() => client.send(JSON.stringify(Actions.makeStart()))}/> : ''}
            {this.state.jeu.etat === Etats.FINI ? <input type="button" value="Prochain jeu"
                                                         onClick={() => client.send(
                                                             JSON.stringify(Actions.makeProchainJeu()))}/> : ''}
            <Chat chat={this.state.jeu.chat}
                  onSubmit={message => client.send(JSON.stringify(Actions.makeSendMessage(message)))}/>
            <input type="button" value={this.state.jeu.etat===Etats.ATTENDANT ? 'Quitter le jeu' : 'Fermer le jeu'}
                   onClick={() => client.send(JSON.stringify(Actions.makeQuitterJeu()))}/>
        </div>;
    }
}

function notifyUser(text: string, sound: string) {
    if (pageActive) {
        return;
    }
    const audio = new Audio('/tarot/static/' + sound + '.ogg');
    audio.play()
        .catch(() => {
            const fallbackAudio = new Audio('/tarot/static/' + sound + '.mp3');
            fallbackAudio.play();
        });
}

let pageActive = true;
window.addEventListener('focus', () => pageActive = true);
window.addEventListener('blur', () => pageActive = false);
