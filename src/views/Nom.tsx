import React from 'react';

export interface INomProps {
    nom: string | string[];
    divider?: string;
}

export default class Nom extends React.Component<INomProps> {
    public static defaultProps: INomProps = {
        divider: ', ',
        nom: [],
    };

    public render() {
        const style = {display: 'inline-block'};
        if (typeof this.props.nom === 'string') {
            return <div style={style}>{this.props.nom}</div>;
        } else {
            return <span>{this.props.nom?.map((nom, i, array) => <span key={i}>
                <div style={style}>{nom}</div>
                {i !== array.length - 1 ? this.props.divider : ''}
            </span>)}</span>;
        }
    }
}
