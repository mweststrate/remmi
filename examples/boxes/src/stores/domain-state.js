import { createStore, model, select } from "remmi"

import {randomUuid} from '../utils';

export function createBoxesStore(initialState = {
    boxes: {},
    arrows: {},
    selection: null
}) {
    const storeCursor = createStore(initialState)

    const id1 = createBox(storeCursor, "Roosendaal", 100, 100)
    const id2 = createBox(storeCursor, "Amsterdam", 650, 300)
    const id3 = createBox(storeCursor, "Prage", 150, 300)
    createArrow(storeCursor, id1, id2)
    createArrow(storeCursor, id2, id3)

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
//     Serialize this store to json
// */
// const serializeBox = createTransformer(box => ({...box}));

// const serializeArrow = createTransformer(arrow => ({
//     id: arrow.id,
//     to: arrow.to.id,
//     from: arrow.from.id
// }));

// export const serializeState = createTransformer(store => ({
//     boxes: store.boxes.map(serializeBox),
//     arrows: store.arrows.map(serializeArrow),
//     selection: store.selection ? store.selection.id : null
// }));

// /**
//     Update the store from the given json
// */
// export function deserializeState(store, data) {
//     const findBox = id => store.boxes.find(box => box.id === id);
//     store.boxes = data.boxes.map(box => new Box(box.name, box.x, box.y, box.id));
//     store.arrows = data.arrows.map(arrow => ({
//         id: arrow.id,
//         from: findBox(arrow.from),
//         to: findBox(arrow.to)
//     }));
//     store.selection = findBox(data.selection);
// }

// /**
//     Generate 'amount' new random arrows and boxes
// */
// export function generateStuff(amount) {
//     transaction(() => {
//         for(var i = 0; i < amount; i++) {
//             store.boxes.push(new Box('#' + i, Math.random() * window.innerWidth * 0.5, Math.random() * window.innerHeight));
//             store.arrows.push({
//                 id: randomUuid(),
//                 from: store.boxes[Math.floor(Math.random() * store.boxes.length)],
//                 to:   store.boxes[Math.floor(Math.random() * store.boxes.length)]
//             });
//         }
//     });
// }
