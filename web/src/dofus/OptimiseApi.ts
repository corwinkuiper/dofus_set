interface SetWeightOptions {
  weights: number[]
  maxLevel: number
}

interface OptimiseSetResponse {
  overallCharacteristics: number[]
  items: { name: string, characteristics: number[], itemType: string, level: number, imageUrl?: string }[]
  setBonuses: { name: string, characteristics: number[], numberOfItems: number }[]
}

export class OptimiseApi {
  private readonly apiEndpoint: string

  constructor(apiEndpoint: string) {
    this.apiEndpoint = apiEndpoint
  }

  async optimiseSet(options: SetWeightOptions): Promise<OptimiseSetResponse> {
    const response = await fetch(`${this.apiEndpoint}/api/optimise`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        weights: options.weights,
        max_level: options.maxLevel,
      })
    })

    const content = await response.json()

    interface OptimiseApiResponseItem {
      characteristics: number[]
      name: string
      item_type: string
      level: number
      image_url?: string
    }

    interface OptimiseApiResponseSetBonus {
      name: string
      number_of_items: number
      characteristics: number[]
    }

    return {
      overallCharacteristics: content.overall_characteristics,
      items: (content.items as OptimiseApiResponseItem[]).map(item => ({
        name: item.name, characteristics: item.characteristics, itemType: item.item_type, level: item.level, imageUrl: item.image_url
      })),
      setBonuses: (content.set_bonuses as OptimiseApiResponseSetBonus[]).map(setBonus => ({
        name: setBonus.name,
        numberOfItems: setBonus.number_of_items,
        characteristics: setBonus.characteristics,
      })),
    }
  }
}