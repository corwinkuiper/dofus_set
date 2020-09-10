interface SetWeightOptions {
  weights: number[]
  maxLevel: number
}

interface OptimiseSetResponse {
  overallCharacteristics: number[]
  items: { name: string, characteristics: number[], itemType: string, level: number, imageUrl?: string }[]
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
    return {
      overallCharacteristics: content.overall_characteristics,
      items: (content.items as any[]).map((item: { characteristics: number[], name: string, item_type: string, level: number, image_url?: string }) => ({
        name: item.name, characteristics: item.characteristics, itemType: item.item_type, level: item.level, imageUrl: item.image_url
      }))
    }
  }
}