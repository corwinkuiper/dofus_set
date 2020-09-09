import React from 'react'
import './App.css'

import { OptimiseApi } from './dofus/OptimiseApi'

import { WeightsSelector, WeightsState } from './WeightsSelector'

class Items {
  readonly name: string
  readonly characteristics: number[]
  readonly level: number

  constructor(name: string, characteristics: number[], level: number) {
    this.name = name
    this.characteristics = characteristics
    this.level = level
  }

  public displayString(): string {
    return `${this.name} - ${this.level}`
  }
}

class AppState {
  weightsState = new WeightsState([])
  bestItems: Items[] = []
}

class App extends React.Component<{}, AppState> {
  state = new AppState()

  private readonly api: OptimiseApi

  constructor(props: {}) {
    super(props)

    this.api = new OptimiseApi('')
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

    const bestItems = setResult.items.map(item => new Items(item.name, item.characteristics, item.level))
    this.setState(Object.assign({}, this.state, { bestItems }))
  }

  private itemText(): string {
    return this.state.bestItems.map(item => item.displayString()).join('\n')
  }

  render() {
    return (
      <>
        <WeightsSelector weights={this.state.weightsState} updateWeightsState={this.updateWeightsState} />
        <p>{this.itemText()}</p>
        <button onClick={this.runOptimiser}>Optimise!</button>
      </>
    )
  }
}

export default App
