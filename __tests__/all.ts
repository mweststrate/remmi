"use strict"

import {createStore, merge} from "../src/remmi"

test("all 1", () => {
    const s = createStore({
        a: 3,
        b: { x: 4 }
    })

    const a = s.all()

    const v = a.value()
    expect(v.length).toBe(2)
    expect(v[0][0]).toBe("a")
    expect(v[1][0]).toBe("b")

    const lA = v[0][1]
    const lB = v[1][1]
    expect(lA.value()).toBe(3)
    expect(lB.value()).toEqual({ x: 4 })

    const sub = a.subscribe(newValue => {
        expect(newValue).toEqual([["b", lB]])
    })
    s.update(d => { delete d.a })
})

test("all 2", () => {
    const s = createStore([
        3,
        { x: 4 }
    ])

    const a = s.all()

    const v = a.value()
    expect(v.length).toBe(2)

    const [lA, lB] = v
    expect(lA.value()).toBe(3)
    expect(lB.value()).toEqual({ x: 4 })

    const sub = a.subscribe(newValue => {
        expect(newValue).toEqual([lA])
    })
    s.update(d => { d.splice(0, 1) })
    sub()

    debugger
    s.update(d => { d.push(17)})
    debugger
    expect(a.value().length).toBe(2)
    expect(a.value()[0]).toBe(lA)
    expect(lA.value()).toEqual({x: 4})
    expect(lB.value()).toEqual(17)
    expect(a.value()[1].value()).toBe(17)
})