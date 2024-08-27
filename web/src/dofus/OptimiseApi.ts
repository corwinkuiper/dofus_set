import { ItemResponse } from "./Items";
import { Optimiser } from "./Optimiser";

export interface OptimiseRequest {
  weights: number[];
  maxLevel: number;
  fixedItems: (number | undefined)[];
  bannedItems: number[];
  apExo: boolean;
  mpExo: boolean;
  rangeExo: boolean;
  multiElement: boolean;
  iterations: number;
}

interface OptimiseSetResponse {
  overallCharacteristics: number[];
  items: (ItemResponse | null)[];
  setBonuses: {
    name: string;
    characteristics: number[];
    numberOfItems: number;
  }[];
}

export interface OptimiseApiResponse {
  overall_characteristics: number[];
  items: (OptimiseApiResponseItem | null)[];
  set_bonuses: OptimiseApiResponseSetBonus[];
}

interface OptimiseApiResponseItem {
  characteristics: number[];
  name: string;
  item_type: string;
  level: number;
  image_url?: string;
  dofus_id: number;
}

interface OptimiseApiResponseSetBonus {
  name: string;
  number_of_items: number;
  characteristics: number[];
}

export class OptimiseApi {
  private readonly optimiser: Optimiser;

  constructor(optimiser: Optimiser) {
    this.optimiser = optimiser;
  }

  async optimiseSet(options: OptimiseRequest): Promise<OptimiseSetResponse> {
    const content = await this.optimiser.optimise(options);

    return {
      overallCharacteristics: content.overall_characteristics,
      items: content.items.map(
        (item) =>
          item && {
            name: item.name,
            characteristics: item.characteristics,
            itemType: item.item_type,
            level: item.level,
            imageUrl: item.image_url,
            dofusId: item.dofus_id,
          }
      ),
      setBonuses: content.set_bonuses.map((setBonus) => ({
        name: setBonus.name,
        numberOfItems: setBonus.number_of_items,
        characteristics: setBonus.characteristics,
      })),
    };
  }
}
