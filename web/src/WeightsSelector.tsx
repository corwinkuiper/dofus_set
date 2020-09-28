import React from 'react'
import * as DofusStats from './dofus/stats'
import { StatIcon } from './App/StatIcon';

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
    const newWeightValue = parseFloat(event.currentTarget.value)
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
      <tr className="app-weight-option">
        <td>
          <StatSelector onStatChange={this.statChange} value={this.props.weight.statId} />
        </td>
        <td>
          <input type="text" value={this.state.currentWeightValue} onChange={this.weightValueChange} />
        </td>
      </tr>
    )
  }
}

export function ExoSelector({ exoOptions, updateExoOptions }: { exoOptions: ExoOptions, updateExoOptions: (newOptions: ExoOptions) => void }) {
  function toggleExoValue(name: 'apExo' | 'mpExo' | 'rangeExo') {
    updateExoOptions(Object.assign({}, exoOptions, {
      [name]: !exoOptions[name]
    }))
  }

  return (
    <div className="exo-selector">
      <div className="exo-checkbox">
        <label htmlFor="ap-exo">
          <StatIcon statIndex={0} />
          AP exo
        </label>
        <input type="checkbox" id="ap-exo" checked={exoOptions.apExo} onChange={() => toggleExoValue('apExo')} />
      </div>
      <div className="exo-checkbox">
        <label htmlFor="mp-exo">
          <StatIcon statIndex={1} />
          MP exo
        </label>
        <input type="checkbox" id="mp-exo" checked={exoOptions.mpExo} onChange={() => toggleExoValue('mpExo')} />
      </div>
      <div className="exo-checkbox">
        <label htmlFor="range-exo">
          <StatIcon statIndex={2} />
          Range exo
        </label>
        <input type="checkbox" id="range-exo" checked={exoOptions.rangeExo} onChange={() => toggleExoValue('rangeExo')} />
      </div>
    </div>
  )
}

export interface ExoOptions {
  readonly apExo: boolean
  readonly mpExo: boolean
  readonly rangeExo: boolean
}

export class WeightsState {
  public readonly weights: WeightOption[]
  public readonly exoOptions: ExoOptions

  constructor(weights: WeightOption[], exoOptions: ExoOptions) {
    if (weights.length === 0) {
      this.weights = [{
        weightValue: 1,
        statId: 0,
      }]
    } else {
      this.weights = weights
    }

    this.exoOptions = exoOptions

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

  public weightWithStatId(id: number): number {
    return this.weights.find(w => w.statId === id)?.weightValue ?? 0
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

    return new WeightsState(statWeights, this.exoOptions)
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

    return new WeightsState(statWeights, this.exoOptions)
  }

  public alterExoOptions(newExoOptions: ExoOptions) {
    return new WeightsState(this.weights, newExoOptions)
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
        <table>
          <thead>
            <tr>
              <th>Stat</th><th>Weight</th>
            </tr>
          </thead>
          <tbody>
            {
              this.props.weights.weights
                .map((statWeight, i) =>
                  <Weight weight={statWeight} key={i} onWeightOptionChange={(this.weightOptionChange.bind(this, i))} />)
            }
          </tbody>
        </table>
        <button onClick={this.addWeightOption} className="add-weight-button">+ Add weight</button>
      </div>
    )
  }
}