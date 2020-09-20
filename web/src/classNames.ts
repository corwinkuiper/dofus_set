export function classNames(classes: { [className: string]: boolean }) {
    return Object.entries(classes).filter(entry => entry[1]).map(entry => entry[0]).join(' ')
}