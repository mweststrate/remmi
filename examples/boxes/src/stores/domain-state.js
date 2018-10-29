import { createStore } from "remmi"

import {randomUuid} from '../utils';

export function createBoxesStore(initialState = {
    boxes: {},
    arrows: {},
    selection: null
}) {
    const storeCursor = createStore(initialState)

    storeCursor.update(() => {
        // by wrapping in an update, we make this one atomic update
        const id1 = createBox(storeCursor, "Roosendaal", 100, 100)
        const id2 = createBox(storeCursor, "Amsterdam", 650, 300)
        const id3 = createBox(storeCursor, "Prague", 150, 300)
        createArrow(storeCursor, id1, id2)
        createArrow(storeCursor, id2, id3)
    })

    return storeCursor
}

export function createBox(storeCursor, name, x, y) {
    const id = randomUuid()
    storeCursor.update(d => {
        d.boxes[id] = { id, name, x, y }
    })
    return id
}

export function createArrow(storeCursor, from, to) {
    storeCursor.update(d => {
        const id = randomUuid()
        d.arrows[id] = { id, from, to }
    })
}

export function boxWidth(box) {
    return box.name.length * 15
}


// /**
//     Generate 'amount' new random arrows and boxes
// */
export function generateStuff(storeCursor, amount) {
    const ids = Object.keys(storeCursor.value().boxes)
    storeCursor.update(() => {
        for(var i = 0; i < amount; i++) {
            const id = createBox(storeCursor,
                '#' + i,
                Math.random() * window.innerWidth * 0.5,
                Math.random() * window.innerHeight
            )
            createArrow(storeCursor, ids[Math.floor(Math.random() * ids.length)], id)
            ids.push(id)
        }
    })
}
