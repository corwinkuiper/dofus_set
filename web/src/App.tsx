import React from 'react'
import './App.css'

import * as DofusStats from './dofus/stats'

class StatSelector extends React.Component<{ onStatChange: (statId: number) => void, value: number }> {
  constructor(props: { onStatChange: (statId: number) => void, value: number }) {
    super(props)

    this.handleChange = this.handleChange.bind(this);
  }

  private handleChange(event: React.FormEvent<HTMLSelectElement>) {
    const newStatId = parseInt(event.currentTarget.value, 10)

    this.props.onStatChange?.(newStatId)
  }

  render() {
    return (
      <select value={this.props.value} onChange={this.handleChange}>
        {DofusStats.StatNames.map((statName, i) => <option value={i} key={i}>{statName}</option>)}
      </select>
    )
  }
}

interface WeightOption {
  weightNumber: number
  statId: number
}

class Weight extends React.Component<{ onWeightOptionChange: (newOption: WeightOption) => void, weight: WeightOption }, { currentWeightValue: string }> {
  constructor(props: { onWeightOptionChange: (newOption: WeightOption) => void, weight: WeightOption }) {
    super(props)

    this.weightValueChange = this.weightValueChange.bind(this)
    this.statChange = this.statChange.bind(this)

    this.state = { currentWeightValue: this.props.weight.weightNumber.toString() }
  }

  weightValueChange(event: React.FormEvent<HTMLInputElement>) {
    const newWeightValue = parseInt(event.currentTarget.value, 10)
    this.setState(Object.assign(this.state, { currentWeightValue: event.currentTarget.value }))
    if (newWeightValue !== newWeightValue) {
      return
    }

    this.props.onWeightOptionChange(Object.assign(this.props.weight, {
      weightNumber: newWeightValue,
    }))
  }

  statChange(statId: number) {
    this.props.onWeightOptionChange(Object.assign(this.props.weight, {
      statId
    }))
  }

  render() {
    return (
      <div className="app-weight-option">
        <StatSelector onStatChange={this.statChange} value={this.props.weight.statId} />
        <input type="text" value={this.state.currentWeightValue} onChange={this.weightValueChange} />
      </div>
    )
  }
}

interface AppState {
  statWeights: WeightOption[]
}

class App extends React.Component<{}, AppState> {
  state = {
    statWeights: [] as WeightOption[]
  }

  constructor(props: {}) {
    super(props)

    this.addWeightOption = this.addWeightOption.bind(this)
  }

  weightOptionChange(index: number, newOption: WeightOption) {
    const statWeights = this.state.statWeights.slice()
    statWeights[index] = newOption
    this.setState(Object.assign(this.state, { statWeights }))
  }

  addWeightOption() {
    const statWeights = this.state.statWeights.slice()
    statWeights.push({
      weightNumber: 0,
      statId: 0,
    })

    this.setState(Object.assign(this.state, { statWeights }))
  }

  render() {
    return (
      <div className="app-weights">
        <div>
          {this.state.statWeights.map((statWeight, i) => <Weight weight={statWeight} key={i} onWeightOptionChange={this.weightOptionChange.bind(this, i)} />)}
        </div>
        <button onClick={this.addWeightOption}>+ Add weight</button>
      </div>
    )
  }
}

export default App
