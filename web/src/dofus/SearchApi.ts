import { Item } from "../Item";
import Fuse, { IFuseOptions } from "fuse.js";
import { Optimiser } from "./Optimiser";

export interface SearchApiResponseItem {
  characteristics: number[];
  name: string;
  item_type: string;
  level: number;
  image_url?: string;
  dofus_id: number;
}

export class SearchApi {
  private readonly optimiser: Optimiser;
  private readonly items: { [slot: number]: Fuse<Item> } = {};

  private static fuseOptions: IFuseOptions<Item> = {
    keys: ["name"],
  };

  constructor(optimiser: Optimiser) {
    this.optimiser = optimiser;
  }

  public async search(slot: number, searchTerm: string): Promise<Item[]> {
    const search = await this.getItemsInSlot(slot);
    const result = search.search(searchTerm);

    return result.map((r) => r.item);
  }

  private async getItemsInSlot(slot: number): Promise<Fuse<Item>> {
    const i = this.items[slot];
    if (i) {
      return i;
    }

    const json: SearchApiResponseItem[] =
      await this.optimiser.get_items_in_slot(slot);

    return (this.items[slot] = new Fuse(
      json.map(
        (item) =>
          new Item(
            item.name,
            item.characteristics,
            item.level,
            item.image_url,
            item.dofus_id
          )
      ),
      SearchApi.fuseOptions
    ));
  }
}
