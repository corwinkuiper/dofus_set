import React from 'react'
import './App.css'

import { OptimiseApi } from './dofus/OptimiseApi'
import { SearchApi } from './dofus/SearchApi'
import { Item } from './Item'
import { SetBonus } from './SetBonus'

import { WeightsSelector, ExoSelector, ExoOptions, WeightsState } from './WeightsSelector'
import { Spinner } from './Spinner'

import { LevelSelector } from './App/LevelSelector'
import { BannedItems } from './App/BannedItems'
import { BestItemDisplay } from './App/BestItemDisplay'
import { OverallCharacteristics } from './App/OverallCharacteristics'
import { SearchBox } from './App/SearchItem'

class AppState {
  weightsState = new WeightsState([], { apExo: false, mpExo: false, rangeExo: false, multiElement: false })
  bestItems: (Item | null)[] = []
  bannedItems: Item[] = []
  pinnedSlots: number[] = []
  resultingCharacteristics: number[] = []
  setBonuses: SetBonus[] = []
  maxLevel: number = 149
  optimising: boolean = false
  searchingSlot: number | undefined = undefined
  rateLimited: boolean = false
}

function OptimisationSettings({ weights, updateWeightsState, maxLevel, setMaxLevel }: { weights: WeightsState, updateWeightsState: (newWeightsState: WeightsState) => void, maxLevel: number, setMaxLevel: (newMaxLevel: number) => void }) {
  return (
    <div className="optimisation-settings">
      <div className="optimisation-header">
        <a href="https://blog.kuiper.dev/optimisation-of-dofus-equipment-sets" target="_blank" rel="noopener noreferrer">Help!</a>
        <LevelSelector maxLevel={maxLevel} setMaxLevel={setMaxLevel} />
      </div>
      <WeightsSelector weights={weights} updateWeightsState={updateWeightsState} />
      <ExoSelector exoOptions={weights.exoOptions} updateExoOptions={(newOptions: ExoOptions) => updateWeightsState(weights.alterExoOptions(newOptions))} />
    </div>
  )
}

class App extends React.Component<{}, AppState> {
  state = new AppState()

  private readonly api: OptimiseApi
  private readonly searchApi: SearchApi

  constructor(props: {}) {
    super(props)

    const apiHost = window.location.host === 'localhost:3000' ? 'http://localhost:8000' : ''

    this.searchApi = new SearchApi(apiHost)
    this.api = new OptimiseApi(apiHost)
    this.updateWeightsState = this.updateWeightsState.bind(this)
    this.setMaxLevel = this.setMaxLevel.bind(this)
    this.togglePinned = this.togglePinned.bind(this)
    this.banItem = this.banItem.bind(this)
    this.unbanItem = this.unbanItem.bind(this)
    this.setItem = this.setItem.bind(this)
    this.toggleSearch = this.toggleSearch.bind(this)

    this.runOptimiser = this.runOptimiser.bind(this)
  }

  private updateWeightsState(newWeightsState: WeightsState) {
    this.setState({ weightsState: newWeightsState })
  }

  private setMaxLevel(newMaxLevel: number) {
    this.setState({ maxLevel: newMaxLevel })
  }

  private async runOptimiser() {
    if (this.state.optimising) {
      return
    }

    try {
      this.setState({ optimising: true })

      const weights = []
      for (let i = 0; i < 51; i++) {
        const weightValue = this.state.weightsState.weights.find(weight => weight.statId === i)?.weightValue ?? 0
        weights.push(weightValue)
      }

      const fixedItems: (number | undefined)[] = []
      for (let slot = 0; slot < 16; slot++) {
        if (this.state.pinnedSlots.includes(slot)) {
          const bestItem = this.state.bestItems[slot]?.dofusId
          fixedItems.push(bestItem)
        } else {
          fixedItems.push(undefined)
        }
      }

      const exoOptions = this.state.weightsState.exoOptions
      const setResult = await this.api.optimiseSet({
        weights: weights,
        maxLevel: this.state.maxLevel,
        fixedItems,
        bannedItems: this.state.bannedItems.map(item => item.dofusId),
        apExo: exoOptions.apExo,
        mpExo: exoOptions.mpExo,
        rangeExo: exoOptions.rangeExo,
        multiElement: exoOptions.multiElement,
      })

      if (setResult.rateLimited) {
        this.rateLimited()
        return
      }

      const bestItems = setResult.items.map(item => item && new Item(item.name, item.characteristics, item.level, item.imageUrl, item.dofusId))
      const setBonuses = setResult.setBonuses.map(bonus => new SetBonus(bonus.name, bonus.characteristics, bonus.numberOfItems))
      this.setState({ bestItems, setBonuses, resultingCharacteristics: setResult.overallCharacteristics })
    } finally {
      this.setState({ optimising: false })
    }
  }

  private rateLimited() {
    this.setState({ rateLimited: true })
    setTimeout(() => this.setState({ rateLimited: false }), 3000)
  }

  togglePinned(slot: number) {
    let newPinnedSlots = this.state.pinnedSlots.slice()
    if (newPinnedSlots.includes(slot)) {
      newPinnedSlots = newPinnedSlots.filter(s => s !== slot)
    } else {
      newPinnedSlots.push(slot)
    }

    this.setState({ pinnedSlots: newPinnedSlots })
  }

  toggleSearch(slot: number) {
    if (this.state.searchingSlot === slot) {
      this.setState({ searchingSlot: undefined })
    } else {
      this.setState({ searchingSlot: slot })
    }
  }

  setItem(slot: number, item: Item) {
    const newBestItems = this.state.bestItems.slice()
    newBestItems[slot] = item
    this.setState({ bestItems: newBestItems })

    if (!this.state.pinnedSlots.includes(slot)) {
      this.togglePinned(slot)
    }
  }

  banItem(item: Item) {
    const newBannedItems = this.state.bannedItems
    if (!newBannedItems.find(i => i.dofusId === item.dofusId)) {
      newBannedItems.push(item)
    }

    this.setState({ bannedItems: newBannedItems })
  }

  unbanItem(item: Item) {
    this.setState({
      bannedItems: this.state.bannedItems.filter(i => i.dofusId !== item.dofusId)
    })
  }

  render() {
    return (
      <div className="app-container">
        <div className="weights-container">
          <OptimisationSettings weights={this.state.weightsState} updateWeightsState={this.updateWeightsState} maxLevel={this.state.maxLevel} setMaxLevel={this.setMaxLevel} />
          <button className="optimise-button" disabled={this.state.optimising || this.state.rateLimited} onClick={this.runOptimiser}>
            Optimise!
            {this.state.optimising && <Spinner />}
            {this.state.rateLimited && " (server busy, please try again)"}
          </button>
          {
            this.state.searchingSlot !== undefined &&
            <SearchBox
              searchApi={this.searchApi}
              setItem={this.setItem}
              slot={this.state.searchingSlot}
              weights={this.state.weightsState} />
          }
          <BannedItems items={this.state.bannedItems} unban={this.unbanItem} />
        </div>
        <BestItemDisplay
          items={this.state.bestItems}
          weights={this.state.weightsState}
          setBonuses={this.state.setBonuses}
          pinnedSlots={this.state.pinnedSlots}
          togglePinned={this.togglePinned}
          banItem={this.banItem}
          searchingSlot={this.state.searchingSlot}
          toggleSearchSlot={this.toggleSearch} />
        <OverallCharacteristics characteristics={this.state.resultingCharacteristics} />
      </div>
    )
  }
}

export default App
