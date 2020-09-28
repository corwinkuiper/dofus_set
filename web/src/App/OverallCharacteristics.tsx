import React from 'react'
import { StatNames } from '../dofus/stats'
import { StatIcon } from './StatIcon'

export function OverallCharacteristics({ characteristics }: { characteristics: number[] }) {
    return (
        <table className="resulting-characteristics">
            {characteristics.map((value, index) => (
                <tr key={index}>
                    <td><StatIcon statIndex={index} /></td>
                    <td>{value}</td>
                    <td>{StatNames[index]}</td>
                </tr>
            ))}
        </table>
    )
}
