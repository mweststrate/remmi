"use strict"

import {createStore, autorun} from "../src/remmi"

test("tracker 1", () => {
    const s = createStore({x: 3, y: 4})
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

test("tracker 2", () => {
    const s = createStore([{x: 3]])
    const events: number[] = []

    const d = autorun(() => {
        events.push(s.select(0).select("x").value())
    })

    expect(events).toEqual([3])

    s.update(d => {
        d[0].x = 4
    })

    expect(events).toEqual([3, 4])

    s.update(d => {
        d.push({ x: 1 })
    })

    expect(events).toEqual([3, 4])

    s.update(d => {
        d.shift()
    })

    expect(events).toEqual([3, 4, 1])

    s.update(d => {
        d[0].y = 2
    })

    expect(events).toEqual([3, 4, 1])
})


test("tracker 2", () => {
    const s = createStore([{x: 3]])
    const events: number[] = []
    const x = s.select(0).select("x")
    const d = autorun(() => {
        events.push(x.value())
    })

    expect(events).toEqual([3])

    s.update(d => {
        d[0].x = 4
    })

    expect(events).toEqual([3, 4])

    s.update(d => {
        d.push({ x: 1 })
    })

    expect(events).toEqual([3, 4])

    s.update(d => {
        d.shift()
    })

    expect(events).toEqual([3, 4, 1])

    s.update(d => {
        d[0].y = 2
    })

    expect(events).toEqual([3, 4, 1])
})