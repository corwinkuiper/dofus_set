import { Item } from '../Item'
import Fuse from 'fuse.js'

export class SearchApi {
    private readonly apiEndpoint: string
    private readonly items: { [slot: number]: Fuse<Item> } = {}

    private static fuseOptions: Fuse.IFuseOptions<Item> = {
        keys: [
            'name'
        ]
    }

    constructor(apiEndpoint: string) {
        this.apiEndpoint = apiEndpoint
    }

    public async search(slot: number, searchTerm: string): Promise<Item[]> {
        const search = await this.getItemsInSlot(slot)
        const result = search.search(searchTerm)

        return result.map(r => r.item)
    }

    private async getItemsInSlot(slot: number): Promise<Fuse<Item>> {
        const i = this.items[slot]
        if (i) {
            return i
        }

        interface SearchApiResponseItem {
            characteristics: number[]
            name: string
            item_type: string
            level: number
            image_url?: string
            dofus_id: number
        }

        const res = await fetch(`${this.apiEndpoint}/api/item/slot/${slot}`)
        const json: SearchApiResponseItem[] = await res.json()

        return this.items[slot] = new Fuse(
            json.map(item => new Item(
                item.name,
                item.characteristics,
                item.level,
                item.image_url,
                item.dofus_id,
            )),
            SearchApi.fuseOptions
        )
    }
}