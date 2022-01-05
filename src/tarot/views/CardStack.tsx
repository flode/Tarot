import React from 'react';

import {Card as CardEnum} from '../enums/Card';

import Card from './Card';

export interface ICardStackProps {
    cartes: CardEnum[];
    onClick?: (card: CardEnum) => void;
    className?: string;
}

export default class CardStack extends React.Component<ICardStackProps> {
    public static defaultProps: ICardStackProps = {
        cartes: [],
    };

    public render() {
        const {cartes, onClick, ...forwardProps} = this.props;
        const cardStack = cartes.map((carte, i) => <Card key={carte === '--' ? i : carte} card={carte}
                                                         onClick={onClick}/>);
        return <div {...forwardProps}>
            {cardStack}
        </div>;
    }
}
