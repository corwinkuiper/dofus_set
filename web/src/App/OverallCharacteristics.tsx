import React from 'react';
import { StatNames } from '../dofus/stats';

export function OverallCharacteristics({ characteristics }: { characteristics: number[]; }) {
    return (
        <table className="resulting-characteristics">
            {characteristics.map((value, index) => (
                <tr key={index}>
                    <td>{value}</td>
                    <td>{StatNames[index]}</td>
                </tr>
            ))}
        </table>
    );
}
