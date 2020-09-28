import React from 'react'
import { StatNames, getStatIconURL } from '../dofus/stats'

export function OverallCharacteristics({ characteristics }: { characteristics: number[] }) {
    return (
        <table className="resulting-characteristics">
            {characteristics.map((value, index) => (
                <tr key={index}>
                    <td>
                        <div className="stat-icon-container">
                            <img className="stat-icon" src={getStatIconURL(index)} />
                        </div>
                    </td>
                    <td>{value}</td>
                    <td>{StatNames[index]}</td>
                </tr>
            ))}
        </table>
    )
}
