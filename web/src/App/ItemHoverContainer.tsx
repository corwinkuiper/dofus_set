import * as React from 'react'
import { WeightsState } from '../WeightsSelector'
import { StatNames } from '../dofus/stats'
import { StatIcon } from './StatIcon'

function HoverStatDisplay({ x, y, characteristics, weights }: { x: number, y: number, characteristics: number[], weights: WeightsState }) {
    const totalEnergy = characteristics.reduce((acc, characteristic, index) => weights.weightWithStatId(index) * characteristic + acc, 0)

    return (
        <div style={{ top: y, left: x }} className="characteristics-hover">
            <table>
                {characteristics.map((characteristic, index) => characteristic !== 0 &&
                    <tr key={index}>
                        <td><StatIcon statIndex={index} /></td>
                        <td>{characteristic}</td>
                        <td>{StatNames[index]}</td>
                        <td>{totalEnergy ? (weights.weightWithStatId(index) * characteristic * 100 / totalEnergy).toFixed(0) : '~'}%</td>
                    </tr>
                )}
            </table>
        </div>
    )
}

export class ItemHoverContainer extends React.Component<{ children: React.ReactNode; characteristics: number[]; weights: WeightsState; }, { showBox: boolean; x: number; y: number; }> {
    state = { x: 0, y: 0, showBox: false };

    constructor(props: { children: React.ReactNode; characteristics: number[]; weights: WeightsState; }) {
        super(props);

        this.onMouseMove = this.onMouseMove.bind(this);
        this.onMouseOut = this.onMouseOut.bind(this);
    }

    onMouseMove(event: React.MouseEvent) {
        this.setState({
            x: event.clientX,
            y: event.clientY,
            showBox: true
        });
    }

    onMouseOut(event: React.MouseEvent) {
        this.setState({ showBox: false });
    }

    render() {
        return (
            <>
                <div onMouseMove={this.onMouseMove} onMouseOut={this.onMouseOut} className="itembox-container">
                    {this.props.children}
                </div>
                {this.state.showBox && <HoverStatDisplay x={this.state.x} y={this.state.y} characteristics={this.props.characteristics} weights={this.props.weights} />}
            </>
        );
    }
}
