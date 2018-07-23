"use strict"

import {createStore, autorun} from "../src/remmi"

test("tracker 1", () => {
    const s = createStore({ x: 3, y: 4 })
    const xLens = s.select("x")
    const yLens = s.select("y")

    const events: number[] = []

    const d = autorun(() => {
        events.push(xLens.value() + yLens.value())
    })

    expect(events).toEqual([7])

    s.update(d => {
        d.x = 4
    })

    expect(events).toEqual([7, 8])

    s.update(d => {
        d.x = d.y = 5
    })

    expect(events).toEqual([7, 8, 10])
    d()

    s.update(d => {
        d.x = d.y = 4
    })
    expect(events).toEqual([7, 8, 10])
})
