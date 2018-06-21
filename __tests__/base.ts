"use strict"

import {createStore} from "../src/immer-store"

test("read & update through lens", () => {
    const data = {
        loc: {
            x: 3,
            y: 5
        }
    }

    const store = createStore(data)
    expect(store.get()).toBe(data)
    const lens = store.select(s => s.loc)

    expect(lens.get().x).toBe(3)
    const base = lens.get()
    lens.update(l => {
        l.x += 1
    })

    expect(lens.get()).not.toBe(base)
    expect(lens.get().x).toBe(4)

    expect(store.get()).not.toBe(data)
})

test("read & update through subscription", () => {
    const data = {
        loc: {
            x: 3,
            y: 5
        }
    }

    const values: any[] = []
    const store = createStore(data)
    const lens = store.select(s => s.loc)
    const d = lens.subscribe(next => {
        values.push(next)
    })

    lens.update(l => {
        l.x = 4
    })
    expect(lens.get()).toEqual({x: 4, y: 5})
    store.update(s => {
        s.loc.y = 6
    })
    store.update(s => {
        s.irrelevant = true
    })
    store.update(s => {
        s.loc = {a: 2}
    })
    store.update(s => {
        s.loc = null
    })
    store.update(s => {
        s.loc = {b: 3}
    })
    d()

    store.update(s => {
        s.loc = {c: 3}
    })
    expect(lens.get()).toEqual({c: 3})
    expect(values).toEqual([{x: 4, y: 5}, {x: 4, y: 6}, {a: 2}, null, {b: 3}])
})
