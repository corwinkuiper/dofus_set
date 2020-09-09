import React from 'react'
import './App.css'

import * as DofusStats from './dofus/stats'

class Weight extends React.Component<{}, { value: number }> {
  state = { value: 0 }

  constructor(props: {}) {
    super(props)

    this.handleChange = this.handleChange.bind(this);
  }

  private handleChange(event: React.FormEvent<HTMLSelectElement>) {
    this.setState({ value: parseInt(event.currentTarget.value, 10) })
  }

  render() {
    return (
      <select value={this.state.value} onChange={this.handleChange}>
        {DofusStats.StatNames.map((statName, i) => <option value={i} key={i}>{statName}</option>)}
      </select>
    )
  }
}

const App = () => <Weight />

export default App
