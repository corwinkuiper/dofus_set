import React from 'react'
import './App.css'
import { StatNames } from './dofus/stats'

import { OptimiseApi } from './dofus/OptimiseApi'
import { Item } from './Item'
import { SetBonus } from './SetBonus'

import { WeightsSelector, WeightsState } from './WeightsSelector'
import { Spinner } from './Spinner'

import { LevelSelector } from './App/LevelSelector'
import { BannedItems } from './App/BannedItems'

function classNames(classes: { [className: string]: boolean }) {
  return Object.entries(classes).filter(entry => entry[1]).map(entry => entry[0]).join(' ')
}

class AppState {
  weightsState = new WeightsState([])
  bestItems: (Item | null)[] = []
  bannedItems: Item[] = []
  pinnedSlots: number[] = []
  resultingCharacteristics: number[] = []
  setBonuses: SetBonus[] = []
  maxLevel: number = 149
  optimising: boolean = false
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

function BestItemDisplay({ items, weights, setBonuses, pinnedSlots, togglePinned, banItem }: { items: (Item | null)[], weights: WeightsState, setBonuses: SetBonus[], pinnedSlots: number[], togglePinned: (slot: number) => void, banItem: (item: Item) => void }) {
  return (
    <div className="best-item-display">
      {items.map((item, i) => item && <ItemBox item={item} key={i} weights={weights} pinned={pinnedSlots.includes(i)} togglePinned={togglePinned.bind(null, i)} ban={banItem.bind(null, item)} />)}
      {setBonuses.map((bonus, i) => <SetBonusBox bonus={bonus} key={i} weights={weights} />)}
    </div>
  )
}

function OverallCharacteristics({ characteristics }: { characteristics: number[] }) {
  return (
    <table className="resulting-characteristics">
      {characteristics.map((value, index) => (
        <tr key={index}>
          <td>{value}</td>
          <td>{StatNames[index]}</td>
        </tr>
      ))}
    </table>
  )
}

function OptimisationSettings({ weights, updateWeightsState, maxLevel, setMaxLevel }: { weights: WeightsState, updateWeightsState: (newWeightsState: WeightsState) => void, maxLevel: number, setMaxLevel: (newMaxLevel: number) => void }) {
  return (
    <div>
      <LevelSelector maxLevel={maxLevel} setMaxLevel={setMaxLevel} />
      <WeightsSelector weights={weights} updateWeightsState={updateWeightsState} />
    </div>
  )
}

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

class App extends React.Component<{}, AppState> {
  state = new AppState()

  private readonly api: OptimiseApi

  constructor(props: {}) {
    super(props)

    this.api = new OptimiseApi('http://localhost:8000')
    this.updateWeightsState = this.updateWeightsState.bind(this)
    this.setMaxLevel = this.setMaxLevel.bind(this)
    this.togglePinned = this.togglePinned.bind(this)
    this.banItem = this.banItem.bind(this)
    this.unbanItem = this.unbanItem.bind(this)

    this.runOptimiser = this.runOptimiser.bind(this)
  }

  private updateWeightsState(newWeightsState: WeightsState) {
    this.setState({ weightsState: newWeightsState })
  }

  private setMaxLevel(newMaxLevel: number) {
    this.setState({ maxLevel: newMaxLevel })
  }

  private async runOptimiser() {
    if (this.state.optimising) {
      return
    }

    try {
      this.setState({ optimising: true })

      const weights = []
      for (let i = 0; i < 51; i++) {
        const weightValue = this.state.weightsState.weights.find(weight => weight.statId === i)?.weightValue ?? 0
        weights.push(weightValue)
      }

      const fixedItems: (number | undefined)[] = []
      for (let slot = 0; slot < 16; slot++) {
        if (this.state.pinnedSlots.includes(slot)) {
          const bestItem = this.state.bestItems[slot]?.dofusId
          fixedItems.push(bestItem)
        } else {
          fixedItems.push(undefined)
        }
      }

      const setResult = await this.api.optimiseSet({
        weights: weights,
        maxLevel: this.state.maxLevel,
        fixedItems,
        bannedItems: this.state.bannedItems.map(item => item.dofusId),
      })

      const bestItems = setResult.items.map(item => item && new Item(item.name, item.characteristics, item.level, item.imageUrl, item.dofusId))
      const setBonuses = setResult.setBonuses.map(bonus => new SetBonus(bonus.name, bonus.characteristics, bonus.numberOfItems))
      this.setState({ bestItems, setBonuses, resultingCharacteristics: setResult.overallCharacteristics })
    } finally {
      this.setState({ optimising: false })
    }
  }

  togglePinned(slot: number) {
    let newPinnedSlots = this.state.pinnedSlots.slice()
    if (newPinnedSlots.includes(slot)) {
      newPinnedSlots = newPinnedSlots.filter(s => s !== slot)
    } else {
      newPinnedSlots.push(slot)
    }

    this.setState({ pinnedSlots: newPinnedSlots })
  }

  banItem(item: Item) {
    const newBannedItems = this.state.bannedItems
    if (!newBannedItems.find(i => i.dofusId === item.dofusId)) {
      newBannedItems.push(item)
    }

    this.setState({ bannedItems: newBannedItems })
  }

  unbanItem(item: Item) {
    this.setState({
      bannedItems: this.state.bannedItems.filter(i => i.dofusId !== item.dofusId)
    })
  }

  render() {
    return (
      <div className="app-container">
        <div className="weights-container">
          <OptimisationSettings weights={this.state.weightsState} updateWeightsState={this.updateWeightsState} maxLevel={this.state.maxLevel} setMaxLevel={this.setMaxLevel} />
          <button className="optimise-button" disabled={this.state.optimising} onClick={this.runOptimiser}>
            Optimise!
            {this.state.optimising && <Spinner />}
          </button>
          <BannedItems items={this.state.bannedItems} unban={this.unbanItem} />
        </div>
        <BestItemDisplay items={this.state.bestItems} weights={this.state.weightsState} setBonuses={this.state.setBonuses} pinnedSlots={this.state.pinnedSlots} togglePinned={this.togglePinned} banItem={this.banItem} />
        <OverallCharacteristics characteristics={this.state.resultingCharacteristics} />
      </div>
    )
  }
}

export default App
