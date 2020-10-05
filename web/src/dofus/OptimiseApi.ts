import { ItemResponse } from './Items'

interface OptimiseRequest {
  weights: number[]
  maxLevel: number
  fixedItems: (number | undefined)[]
  bannedItems: number[]
  apExo: boolean
  mpExo: boolean
  rangeExo: boolean
}

interface OptimiseSetResponse {
  rateLimited?: false
  overallCharacteristics: number[]
  items: (ItemResponse | null)[]
  setBonuses: { name: string, characteristics: number[], numberOfItems: number }[]
}

interface RateLimitedResponse {
  rateLimited: true
  personal: boolean
}

export class OptimiseApi {
  private readonly apiEndpoint: string

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint
  }

  async optimiseSet(options: OptimiseRequest): Promise<OptimiseSetResponse | RateLimitedResponse> {
    const response = await fetch(`${this.apiEndpoint}/api/optimise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        weights: options.weights,
        max_level: options.maxLevel,
        fixed_items: options.fixedItems,
        banned_items: options.bannedItems,
        exo_ap: options.apExo,
        exo_mp: options.mpExo,
        exo_range: options.rangeExo,
      })
    })

    interface OptimiseApiResponse {
      rate_limited?: false
      overall_characteristics: number[]
      items: (OptimiseApiResponseItem | null)[]
      set_bonuses: OptimiseApiResponseSetBonus[]
    }

    interface OptimiseApiResponseItem {
      characteristics: number[]
      name: string
      item_type: string
      level: number
      image_url?: string
      dofus_id: number
    }

    interface OptimiseApiResponseSetBonus {
      name: string
      number_of_items: number
      characteristics: number[]
    }

    interface OptimiseApiRateLimitedResponse {
      rate_limited: true
      personal: boolean
    }

    const content = await response.json() as OptimiseApiResponse | OptimiseApiRateLimitedResponse

    if (content.rate_limited) {
      return { rateLimited: true, personal: content.personal }
    }

    return {
      overallCharacteristics: content.overall_characteristics,
      items: content.items.map(item => item && ({
        name: item.name, characteristics: item.characteristics, itemType: item.item_type, level: item.level, imageUrl: item.image_url, dofusId: item.dofus_id
      })),
      setBonuses: content.set_bonuses.map(setBonus => ({
        name: setBonus.name,
        numberOfItems: setBonus.number_of_items,
        characteristics: setBonus.characteristics,
      })),
    }
  }
}