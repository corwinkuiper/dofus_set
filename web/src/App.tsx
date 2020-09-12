import React from 'react'
import './App.css'
import { StatNames } from './dofus/stats'

import { OptimiseApi } from './dofus/OptimiseApi'

import { WeightsSelector, WeightsState } from './WeightsSelector'
import { Spinner } from './Spinner'

function getImageUrl(imageUrl: string): string {
  const suffix = imageUrl.slice(imageUrl.lastIndexOf('/') + 1)
  return `https://d2iuiayak06k8j.cloudfront.net/item/${suffix}`
}

class Item {
  readonly name: string
  readonly characteristics: number[]
  readonly level: number
  readonly imageUrl?: string

  constructor(name: string, characteristics: number[], level: number, imageUrl?: string) {
    this.name = name
    this.characteristics = characteristics
    this.level = level

    if (imageUrl) {
      this.imageUrl = getImageUrl(imageUrl)
    }
  }
}

class AppState {
  weightsState = new WeightsState([])
  bestItems: Item[] = []
  resultingCharacteristics: number[] = []
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

function ItemBox({ item, weights }: { item: Item, weights: WeightsState }) {
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
          <span>{topStatIndex ? `${item.characteristics[topStatIndex]} ${StatNames[topStatIndex]}` : `~`}</span>
        </div>
      </div>
    </ItemHoverContainer>
  )
}

function BestItemDisplay({ items, weights }: { items: Item[], weights: WeightsState }) {
  return (
    <div className="best-item-display">
      {items.map((item, i) => <ItemBox item={item} key={i} weights={weights} />)}
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

class LevelSelector extends React.Component<{ maxLevel: number, setMaxLevel: (newMaxLevel: number) => void }> {
  constructor(props: { maxLevel: number, setMaxLevel: (newMaxLevel: number) => void }) {
    super(props)

    this.maxLevelChanged = this.maxLevelChanged.bind(this)
  }

  private maxLevelChanged(event: React.FormEvent<HTMLInputElement>) {
    const parsed = parseInt(event.currentTarget.value, 10)
    if (isNaN(parsed)) {
      return
    }

    this.props.setMaxLevel(Math.floor(parsed))
  }

  render() {
    return (
      <div className="max-level">
        <span>Maximum Level</span>
        <input type="text" value={this.props.maxLevel.toString()} onChange={this.maxLevelChanged} />
      </div>
    )
  }
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

    this.runOptimiser = this.runOptimiser.bind(this)
  }

  private updateWeightsState(newWeightsState: WeightsState) {
    this.setState(Object.assign({}, this.state, { weightsState: newWeightsState }))
  }

  private setMaxLevel(newMaxLevel: number) {
    this.setState(Object.assign({}, this.state, { maxLevel: newMaxLevel }))
  }

  private async runOptimiser() {
    if (this.state.optimising) {
      return
    }

    try {
      this.setState(Object.assign({}, this.state, { optimising: true }))

      const weights = []
      for (let i = 0; i < 51; i++) {
        const weightValue = this.state.weightsState.weights.find(weight => weight.statId === i)?.weightValue ?? 0
        weights.push(weightValue)
      }

      const setResult = await this.api.optimiseSet({
        weights: weights,
        maxLevel: this.state.maxLevel,
      })

      const bestItems = setResult.items.map(item => new Item(item.name, item.characteristics, item.level, item.imageUrl))
      this.setState(Object.assign({}, this.state, { bestItems, resultingCharacteristics: setResult.overallCharacteristics }))
    } finally {
      this.setState(Object.assign({}, this.state, { optimising: false }))
    }
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
        </div>
        <BestItemDisplay items={this.state.bestItems} weights={this.state.weightsState} />
        <OverallCharacteristics characteristics={this.state.resultingCharacteristics} />
      </div>
    )
  }
}

export default App
