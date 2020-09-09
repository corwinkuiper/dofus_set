import React from 'react'
import './App.css'

import { WeightsSelector, WeightsState } from './WeightsSelector'

class AppState {
  weightsState = new WeightsState([])
}

class App extends React.Component<{}, AppState> {
  state = new AppState()

  constructor(props: {}) {
    super(props)

    this.updateWeightsState = this.updateWeightsState.bind(this)
  }

  private updateWeightsState(newWeightsState: WeightsState) {
    this.setState(Object.assign(this.state, { weightsState: newWeightsState }));
  }

  render() {
    return (
      <WeightsSelector weights={this.state.weightsState} updateWeightsState={this.updateWeightsState} />
    )
  }
}

export default App
