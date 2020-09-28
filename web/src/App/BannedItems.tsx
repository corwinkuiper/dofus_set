import * as React from 'react'
import { Item } from '../Item'

function BannedItem({ item, unban }: { item: Item, unban: () => void }) {
    return (
        <div className="itembox">
            {item.imageUrl ? <img className="itembox-image" src={item.imageUrl} alt={item.name} /> : <div className="itembox-image">No Image :(</div>}
            <div className="itembox-data">
                <div className="itembox-options">
                    <span className="itembox-itemname">{item.name}</span>
                    <span className="itembox-level">{item.level}</span>
                </div>
                <div className="itembox-bottom-section">
                    <div />
                    <div className="itembox-actions">
                        <button className="itembox-unban" onClick={unban} />
                    </div>
                </div>
            </div>
        </div>
    )
}

export function BannedItems({ items, unban }: { items: Item[], unban: (item: Item) => void }) {
    return (
        <div className="banlist">
            {items.length > 0 && <h3>Banned items</h3>}
            {items.map((item, i) => <BannedItem item={item} unban={unban.bind(null, item)} key={i} />)}
        </div>
    )
}