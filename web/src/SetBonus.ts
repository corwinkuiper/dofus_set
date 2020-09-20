export class SetBonus {
    readonly name: string
    readonly characteristics: number[]
    readonly numberOfItems: number

    constructor(name: string, characteristics: number[], numberOfItems: number) {
        this.name = name
        this.characteristics = characteristics
        this.numberOfItems = numberOfItems
    }
}