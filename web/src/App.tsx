import React from 'react'
import './App.css'
import { StatNames } from './dofus/stats'

import { OptimiseApi } from './dofus/OptimiseApi'

import { WeightsSelector, WeightsState } from './WeightsSelector'

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
}

function ItemBox({ item, weights }: { item: Item, weights: WeightsState }) {
  let topStatIndex = 0;
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
    <div className="itembox">
      {item.imageUrl ? <img className="itembox-image" src={item.imageUrl} alt={item.name} /> : <div className="itembox-image">No Image :(</div>}
      <div className="itembox-data">
        <div className="itembox-options">
          <span className="itembox-itemname">{item.name}</span>
          <span className="itembox-level">{item.level}</span>
        </div>
        <span>{`${item.characteristics[topStatIndex]} ${StatNames[topStatIndex]}`}</span>
      </div>
    </div>
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

function OptimisationSettings({ weights, updateWeightsState }: { weights: WeightsState, updateWeightsState: (newWeightsState: WeightsState) => void }) {
  return (
    <WeightsSelector weights={weights} updateWeightsState={updateWeightsState} />
  )
}

class App extends React.Component<{}, AppState> {
  state = new AppState()

  private readonly api: OptimiseApi

  constructor(props: {}) {
    super(props)

    this.api = new OptimiseApi('http://localhost:8000')
    this.updateWeightsState = this.updateWeightsState.bind(this)

    this.runOptimiser = this.runOptimiser.bind(this)
  }

  private updateWeightsState(newWeightsState: WeightsState) {
    this.setState(Object.assign(this.state, { weightsState: newWeightsState }));
  }

  private async runOptimiser() {
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
  }

  render() {
    return (
      <div className="app-container">
        <div className="weights-container">
          <OptimisationSettings weights={this.state.weightsState} updateWeightsState={this.updateWeightsState} />
          <button onClick={this.runOptimiser}>Optimise!</button>
        </div>
        <BestItemDisplay items={this.state.bestItems} weights={this.state.weightsState} />
        <OverallCharacteristics characteristics={this.state.resultingCharacteristics} />
      </div>
    )
  }
}

export default App
