import * as React from 'react'

import { WeightsState } from '../WeightsSelector'
import { StatNames } from '../dofus/stats'
import { Item } from '../Item'
import { SetBonus } from '../SetBonus'

import { classNames } from '../classNames'

function HoverStatDisplay({ x, y, characteristics, weights }: { x: number, y: number, characteristics: number[], weights: WeightsState }) {
    const totalEnergy = characteristics.reduce((acc, characteristic, index) => weights.weightWithStatId(index) * characteristic + acc, 0)

    return (
        <div style={{ top: y, left: x }} className="characteristics-hover">
            <table>
                {characteristics.map((characteristic, index) => characteristic !== 0 &&
                    <tr key={index}>
                        <td>{characteristic}</td>
                        <td>{StatNames[index]}</td>
                        <td>{totalEnergy ? (weights.weightWithStatId(index) * characteristic * 100 / totalEnergy).toFixed(0) : '~'}%</td>
                    </tr>
                )}
            </table>
        </div>
    )
}

class ItemHoverContainer extends React.Component<{ children: React.ReactNode, characteristics: number[], weights: WeightsState }, { showBox: boolean, x: number, y: number }> {
    state = { x: 0, y: 0, showBox: false }

    constructor(props: { children: React.ReactNode, characteristics: number[], weights: WeightsState }) {
        super(props)

        this.onMouseMove = this.onMouseMove.bind(this)
        this.onMouseOut = this.onMouseOut.bind(this)
    }

    onMouseMove(event: React.MouseEvent) {
        this.setState({
            x: event.clientX,
            y: event.clientY,
            showBox: true
        })
    }

    onMouseOut(event: React.MouseEvent) {
        this.setState({ showBox: false })
    }

    render() {
        return (
            <>
                <div onMouseMove={this.onMouseMove} onMouseOut={this.onMouseOut} className="itembox-container">
                    {this.props.children}
                </div>
                {this.state.showBox && <HoverStatDisplay x={this.state.x} y={this.state.y} characteristics={this.props.characteristics} weights={this.props.weights} />}
            </>
        )
    }
}

function ItemBox({ item, weights, pinned, togglePinned, ban }: { item: Item, weights: WeightsState, pinned: boolean, togglePinned: () => void, ban: () => void }) {
    let topStatIndex = null;
    let topStatValue = 0;
    for (let i = 0; i < item.characteristics.length; i++) {
        const characteristicWeight = weights.weights.find(w => w.statId === i)?.weightValue ?? 0;
        const value = characteristicWeight * item.characteristics[i];

        if (value > topStatValue) {
            topStatValue = value;
            topStatIndex = i;
        }
    }

    return (
        <ItemHoverContainer characteristics={item.characteristics} weights={weights}>
            <div className="itembox">
                {item.imageUrl ? <img className="itembox-image" src={item.imageUrl} alt={item.name} /> : <div className="itembox-image">No Image :(</div>}
                <div className="itembox-data">
                    <div className="itembox-options">
                        <span className="itembox-itemname">{item.name}</span>
                        <span className="itembox-level">{item.level}</span>
                    </div>
                    <div className="itembox-bottom-section">
                        <span>{topStatIndex !== null ? `${item.characteristics[topStatIndex]} ${StatNames[topStatIndex]}` : `~`}</span>
                        <div className="itembox-actions">
                            <button className="itembox-ban" onClick={ban} />
                            <button className={classNames({ 'itembox-pin': true, 'itembox-pin-active': pinned })} onClick={togglePinned} />
                        </div>
                    </div>
                </div>
            </div>
        </ItemHoverContainer>
    )
}

function SetBonusBox({ bonus, weights }: { bonus: SetBonus, weights: WeightsState }) {
    return (
        <ItemHoverContainer characteristics={bonus.characteristics} weights={weights}>
            <div className="itembox">
                <div className="itembox-data">
                    <div className="itembox-options">
                        <span className="itembox-itemname">{bonus.name}</span>
                        <span className="itembox-level">{bonus.numberOfItems} items</span>
                    </div>
                </div>
            </div>
        </ItemHoverContainer>
    )
}

export function BestItemDisplay({ items, weights, setBonuses, pinnedSlots, togglePinned, banItem }: { items: (Item | null)[], weights: WeightsState, setBonuses: SetBonus[], pinnedSlots: number[], togglePinned: (slot: number) => void, banItem: (item: Item) => void }) {
    return (
        <div className="best-item-display">
            {items.map((item, i) => item && <ItemBox item={item} key={i} weights={weights} pinned={pinnedSlots.includes(i)} togglePinned={togglePinned.bind(null, i)} ban={banItem.bind(null, item)} />)}
            {setBonuses.map((bonus, i) => <SetBonusBox bonus={bonus} key={i} weights={weights} />)}
        </div>
    )
}