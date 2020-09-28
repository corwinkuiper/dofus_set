import * as React from 'react'

interface LevelSelectorProps {
    maxLevel: number
    setMaxLevel: (newMaxLevel: number) => void
}

interface LevelSelectorState {
    currentLevel: string
}

export class LevelSelector extends React.Component<LevelSelectorProps, LevelSelectorState> {
    constructor(props: LevelSelectorProps) {
        super(props)

        this.maxLevelChanged = this.maxLevelChanged.bind(this)

        this.state = { currentLevel: props.maxLevel.toString() }
    }

    private maxLevelChanged(event: React.FormEvent<HTMLInputElement>) {
        const newLevel = event.currentTarget.value
        const parsed = parseInt(newLevel, 10)
        if (isNaN(parsed)) {
            if (newLevel === '') {
                this.setState({ currentLevel: '' })
            }
            return
        }

        this.props.setMaxLevel(Math.floor(parsed))
        this.setState({ currentLevel: parsed.toString() })
    }

    render() {
        return (
            <div className="max-level">
                <span>Maximum level</span>
                <input type="text" value={this.state.currentLevel} onChange={this.maxLevelChanged} />
            </div>
        )
    }
}