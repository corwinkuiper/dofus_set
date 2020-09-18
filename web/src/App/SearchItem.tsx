import * as React from 'react'
import { Item } from '../Item';
import { SearchApi } from '../dofus/SearchApi'
import { WeightsState } from '../WeightsSelector'
import { ItemHoverContainer } from './ItemHoverContainer'
import { StatNames } from '../dofus/stats'

interface SearchBoxState {
    readonly currentSearchTerm: string
    readonly items: Item[]
    readonly isSearching: boolean
}

interface SearchBoxProps {
    readonly slot: number
    readonly searchApi: SearchApi
    readonly setItem: (slot: number, item: Item) => void
    readonly weights: WeightsState
}

export class SearchBox extends React.Component<SearchBoxProps, SearchBoxState> {
    state = {
        currentSearchTerm: '',
        items: [],
        isSearching: false,
    }

    constructor(props: SearchBoxProps) {
        super(props)

        this.searchTermChanged = this.searchTermChanged.bind(this)
    }

    private searchTermChanged(event: React.FormEvent<HTMLInputElement>) {
        this.setState({ currentSearchTerm: event.currentTarget.value })
        this.search()
    }

    private async search() {
        if (this.state.isSearching) {
            return
        }

        this.setState({ isSearching: true })
        try {
            if (!this.state.currentSearchTerm) {
                return
            }

            let items: Item[]
            let searchTerm: string
            do {
                searchTerm = this.state.currentSearchTerm
                items = await this.props.searchApi.search(this.props.slot, searchTerm)
            } while (this.state.currentSearchTerm !== searchTerm)

            this.setState({ items })
        } finally {
            this.setState({ isSearching: false })
        }
    }

    render() {
        return (
            <div className="search-box">
                <div className="input-box">
                    <input type="text" value={this.state.currentSearchTerm} onChange={this.searchTermChanged} />
                </div>

                <div className="search-results">
                    {
                        this.state.items.map((item, key) => <SearchItemDisplay key={key} item={item} setItem={this.props.setItem.bind(null, this.props.slot, item)} weights={this.props.weights} />)
                    }
                </div>
            </div>
        )
    }
}

function SearchItemDisplay({ item, setItem, weights }: { item: Item, setItem: () => void, weights: WeightsState }) {
    let topStatIndex = null;
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
        <ItemHoverContainer weights={weights} characteristics={item.characteristics}>
            <div className="itembox itembox-search" onClick={setItem}>
                {item.imageUrl ? <img className="itembox-image" src={item.imageUrl} alt={item.name} /> : <div className="itembox-image">No Image :(</div>}
                <div className="itembox-data">
                    <div className="itembox-options">
                        <span className="itembox-itemname">{item.name}</span>
                        <span className="itembox-level">{item.level}</span>
                    </div>
                    <div className="itembox-bottom-section">
                        <span>{topStatIndex !== null ? `${item.characteristics[topStatIndex]} ${StatNames[topStatIndex]}` : `~`}</span>
                    </div>
                </div>
            </div>
        </ItemHoverContainer>
    )
}