import React from 'react'
import './App.css'

import * as DofusStats from './dofus/stats'

class StatSelector extends React.Component<{ onStatChange?: (statId: number) => void }, { value: number }> {
  state = { value: 0 }

  constructor(props: { onStatChange?: (statId: number) => void }) {
    super(props)

    this.handleChange = this.handleChange.bind(this);
  }

  private handleChange(event: React.FormEvent<HTMLSelectElement>) {
    const newStatId = parseInt(event.currentTarget.value, 10)
    this.setState({ value: newStatId })

    this.props.onStatChange?.(newStatId)
  }

  render() {
    return (
      <select value={this.state.value} onChange={this.handleChange}>
        {DofusStats.StatNames.map((statName, i) => <option value={i} key={i}>{statName}</option>)}
      </select>
    )
  }
}

const App = () => <StatSelector />

export default App
