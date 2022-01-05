import {Card} from './enums/Card';

export class TarotActions {
    public static readonly COUPE = 'coupe';
    public static readonly PRENDS_PASSE = 'prendsPasse';
    public static readonly FAIRE_JEU = 'faireJeu';
    public static readonly CARTE_CLICK = 'carteClick';
    public static readonly FINI_FAIRE_JEU = 'finiFaireJeu';

    public static readonly makeCoupe = (nombre: number): TarotAction => ({type: TarotActions.COUPE, nombre});

    public static readonly makePrendsPasse = (prends: boolean): TarotAction => ({type: TarotActions.PRENDS_PASSE, prends});

    public static readonly makeFaireJeu = (carte: Card): TarotAction => ({type: TarotActions.FAIRE_JEU, carte});

    public static readonly makeCarteClick = (carte: Card): TarotAction => ({type: TarotActions.CARTE_CLICK, carte});

    public static readonly makeFiniFaireJeu = (): TarotAction => ({type: TarotActions.FINI_FAIRE_JEU});
}

export type TarotAction =
    { type: typeof TarotActions.COUPE; nombre: number } |
    { type: typeof TarotActions.PRENDS_PASSE; prends: boolean } |
    { type: typeof TarotActions.FAIRE_JEU; carte: Card } |
    { type: typeof TarotActions.CARTE_CLICK; carte: Card } |
    { type: typeof TarotActions.FINI_FAIRE_JEU };
