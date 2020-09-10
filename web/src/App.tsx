import React from 'react'
import './App.css'

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

  public displayString(): string {
    return `${this.name} - ${this.level}`
  }
}

class AppState {
  weightsState = new WeightsState([])
  bestItems: Item[] = []
}

function ItemBox({ item }: { item: Item }) {
  return (
    <div className="itembox">
      {item.imageUrl ? <img className="itembox-image" src={item.imageUrl} alt={item.name} /> : <div className="itembox-image">No Image :(</div>}
      <span className="itembox-itemname">{item.name}</span>
      <span className="itembox-level">{item.level}</span>
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
      maxLevel: 155,
    })

    const bestItems = setResult.items.map(item => new Item(item.name, item.characteristics, item.level, item.imageUrl))
    this.setState(Object.assign({}, this.state, { bestItems }))
  }

  render() {
    return (
      <>
        <WeightsSelector weights={this.state.weightsState} updateWeightsState={this.updateWeightsState} />
        <div>
          {this.state.bestItems.map((item, i) => <ItemBox item={item} key={i} />)}
        </div>
        <button onClick={this.runOptimiser}>Optimise!</button>
      </>
    )
  }
}

export default App
