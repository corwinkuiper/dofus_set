import * as React from 'react'

import { getStatIconURL } from "../dofus/stats"

export function StatIcon({ statIndex }: { statIndex: number }) {
    return (
        <div className="stat-icon-container">
            <img className="stat-icon" src={getStatIconURL(statIndex)} />
        </div>
    )
}