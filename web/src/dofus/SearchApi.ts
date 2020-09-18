import { ItemResponse } from './Items'
import Fuse from 'fuse.js'

export class ItemsApi {
    private readonly apiEndpoint: string
    private readonly items: { [slot: number]: Fuse<ItemResponse> } = {}

    private static fuseOptions: Fuse.IFuseOptions<ItemResponse> = {
        keys: [
            'name'
        ]
    }

    constructor(apiEndpoint: string) {
        this.apiEndpoint = apiEndpoint
    }

    public async search(slot: number, searchTerm: string): Promise<ItemResponse[]> {
        const search = await this.getItemsInSlot(slot)
        const result = search.search(searchTerm)

        return result.map(r => r.item)
    }

    private async getItemsInSlot(slot: number): Promise<Fuse<ItemResponse>> {
        const i = this.items[slot]
        if (i) {
            return i
        }

        const res = await fetch(`${this.apiEndpoint}/api/item/slot/${slot}`)
        const json = await res.json()

        this.items[slot] = new Fuse(
            json,
            ItemsApi.fuseOptions
        )

        return json
    }
}