import React from 'react';

import {Card as CardEnum} from '../enums/Card';
import Jeu from '../Jeu';

export interface ICardProps {
    card: CardEnum;
    onClick?: (card: CardEnum) => void;
}

export default class Card extends React.Component<ICardProps> {
    public static defaultProps: ICardProps = {
        card: '--',
    };

    private static findRowColumn(card: CardEnum): { row: number; column: number } {
        switch (card.substring(0, 1)) {
            case 'J':
                return {
                    column: 7,
                    row: 1,
                };
            case 'A': {
                const atout = parseInt(card.substring(1), 10);
                if (atout <= 14) {
                    return {
                        column: atout - 1,
                        row: 0,
                    };
                } else {
                    return {
                        column: atout - 15,
                        row: 1,
                    };
                }
            }
            default: {
                let row: number | undefined;
                switch (card.substring(0, 1)) {
                    case 'P':
                        row = 2;
                        break;
                    case 'C':
                        row = 3;
                        break;
                    case 'K':
                        row = 4;
                        break;
                    case 'T':
                        row = 5;
                        break;
                    default:
                        throw new Error('Invalid card: ' + card);
                }
                return {
                    column: Jeu.cartesType[card.substring(1)],
                    row,
                };
            }
        }
    }

    public render() {
        const card = this.props.card;
        if (card === '--') {
            return <img className="card" src="/tarot/img/back.gif" style={{width: '57px', height: '105px'}}/>;
        }
        const {row, column} = Card.findRowColumn(card);
        const style = {
            background: 'url(/tarot/img/tarotcards.jpg)',
            backgroundPosition: `${-57 * column}px ${-105 * row}px`,
            height: '105px',
            width: '57px',
        };
        return <div className="card" style={style} onClick={() => {
            if (this.props.onClick) {
                this.props.onClick(this.props.card);
            }
        }}/>;
    }
}
