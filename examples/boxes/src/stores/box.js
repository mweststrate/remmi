import {randomUuid} from '../utils';

export function createBox(name, x, y) {
    return { name, x, y, id: randomUuid() }
}

export function Box(lens) {
    return {
        // TODO: boilerplate!, introduce `...lens.facade("x", "y", "name")` ?
        get x() { return lens.value().x },
        get y() { return lens.value().y },
        get name() { return lens.value().name },
        get width() {
            return this.name.length * 15
        }
    }
}

window.Box = Box; // for demo
