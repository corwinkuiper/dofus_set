import * as React from 'react'

export class LevelSelector extends React.Component<{ maxLevel: number, setMaxLevel: (newMaxLevel: number) => void }> {
    constructor(props: { maxLevel: number, setMaxLevel: (newMaxLevel: number) => void }) {
        super(props)

        this.maxLevelChanged = this.maxLevelChanged.bind(this)
    }

    private maxLevelChanged(event: React.FormEvent<HTMLInputElement>) {
        const parsed = parseInt(event.currentTarget.value, 10)
        if (isNaN(parsed)) {
            return
        }

        this.props.setMaxLevel(Math.floor(parsed))
    }

    render() {
        return (
            <div className="max-level">
                <span>Maximum Level</span>
                <input type="text" value={this.props.maxLevel.toString()} onChange={this.maxLevelChanged} />
            </div>
        )
    }
}