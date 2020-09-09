import React from 'react'
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
  weightValue: number
  statId: number
}

class Weight extends React.Component<{ onWeightOptionChange: (newOption: WeightOption) => void, weight: WeightOption }, { currentWeightValue: string }> {
  constructor(props: { onWeightOptionChange: (newOption: WeightOption) => void, weight: WeightOption }) {
    super(props)

    this.weightValueChange = this.weightValueChange.bind(this)
    this.statChange = this.statChange.bind(this)

    this.state = { currentWeightValue: this.props.weight.weightValue.toString() }
  }

  weightValueChange(event: React.FormEvent<HTMLInputElement>) {
    const newWeightValue = parseInt(event.currentTarget.value, 10)
    this.setState(Object.assign({}, this.state, { currentWeightValue: event.currentTarget.value }))
    if (isNaN(newWeightValue)) {
      return
    }

    this.props.onWeightOptionChange(Object.assign({}, this.props.weight, {
      weightValue: newWeightValue,
    }))
  }

  statChange(statId: number) {
    this.props.onWeightOptionChange(Object.assign({}, this.props.weight, {
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

export class WeightsState {
  public readonly weights: WeightOption[]

  constructor(weights: WeightOption[]) {
    this.weights = weights

    this.weightOptionChange = this.weightOptionChange.bind(this)
    this.addWeightOption = this.addWeightOption.bind(this)
  }

  private unusedStatId(): number | undefined {
    const usedIds = []

    for (const statWeight of this.weights) {
      usedIds.push(statWeight.statId)
    }
    if (usedIds.length === DofusStats.StatNames.length) {
      return undefined
    }

    for (let i = 0; i < usedIds.length; i++) {
      if (!usedIds.includes(i)) {
        return i
      }
    }

    return usedIds.length
  }

  public weightOptionChange(index: number, newOption: WeightOption): WeightsState {
    // first check if the stat choice is valid
    const existing = this.weights.find((weightOption, i) => i !== index && weightOption.statId === newOption.statId)
    if (existing) {
      // TODO(GK): Let the user know that they've selected this stat already
      return this
    }

    const statWeights = this.weights.slice()
    statWeights[index] = newOption
    return new WeightsState(statWeights)
  }

  public addWeightOption(): WeightsState {
    const unusedStatId = this.unusedStatId()
    if (unusedStatId === undefined) {
      return this
    }

    const statWeights = this.weights.slice()
    statWeights.push({
      weightValue: 0,
      statId: unusedStatId,
    })

    return new WeightsState(statWeights)
  }
}

export class WeightsSelector extends React.Component<{ weights: WeightsState, updateWeightsState: (newWeightState: WeightsState) => void }> {
  constructor(props: { weights: WeightsState, updateWeightsState: (newWeightState: WeightsState) => void }) {
    super(props)

    this.addWeightOption = this.addWeightOption.bind(this)
  }

  weightOptionChange(index: number, weightOption: WeightOption) {
    this.props.updateWeightsState(this.props.weights.weightOptionChange(index, weightOption))
  }

  addWeightOption() {
    this.props.updateWeightsState(this.props.weights.addWeightOption())
  }

  render() {
    return (
      <div className="app-weights">
        <div>
          {
            this.props.weights.weights
              .map((statWeight, i) =>
                <Weight weight={statWeight} key={i} onWeightOptionChange={(this.weightOptionChange.bind(this, i))} />)
          }
        </div>
        <button onClick={this.addWeightOption}>+ Add weight</button>
      </div>
    )
  }
}