function getImageUrl(imageUrl: string): string {
    const suffix = imageUrl.slice(imageUrl.lastIndexOf('/') + 1)
    return `https://d2iuiayak06k8j.cloudfront.net/item/${suffix}`
}

export class Item {
    readonly name: string
    readonly characteristics: number[]
    readonly level: number
    readonly imageUrl?: string
    readonly dofusId: number

    constructor(name: string, characteristics: number[], level: number, imageUrl: string | undefined, dofusId: number) {
        this.name = name
        this.characteristics = characteristics
        this.level = level
        this.dofusId = dofusId

        if (imageUrl) {
            this.imageUrl = getImageUrl(imageUrl)
        }
    }
}