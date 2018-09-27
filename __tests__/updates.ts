import { nothing } from "immer";
import {createStore, select, merge} from "../src/remmi"

test("store update overloads", () => {
    const s = createStore<any>("3")

    s.update(4)
    expect(s.value()).toBe(4)

    s.update({x: 3})
    expect(s.value()).toEqual({x: 3})

    s.update({y: 2})
    expect(s.value()).toEqual({x: 3, y: 2})

    s.update(undefined)
    expect(s.value()).toEqual(undefined)

    s.update(d => {
        expect(d).toEqual(undefined)
    })

    s.update(3)
    expect(s.value()).toEqual(3)

    s.update(() => nothing)
    expect(s.value()).toEqual(undefined)

    s.update({z: 2})
    expect(s.value()).toEqual({z: 2})

    s.update([])
    expect(s.value()).toEqual([])

    s.update(() => undefined)
    expect(s.value()).toEqual([])

    expect(() => {
        s.update(d => {
            d.push(3)
            return 4
        })
    }).toThrow("An immer producer returned a new value *and* modified its draft")
    expect(s.value()).toEqual([])
})

test("returning new state for select fn should fail", () => {
    const a = createStore<any>({x: { y: 3 }})
    const b = a.do(select(x => x.x))
    b.update(d => void d.y++)
    expect(a.value().x.y).toBe(4)
    expect(() => {
        b.update(5)
    }).toThrow("cannot return a complety new state")
    expect(a.value().x.y).toBe(4)
})

test("select field update overloads", () => {
    const a = createStore<any>({x: "3"})
    const s = a.select("x")

    s.update(4)
    expect(s.value()).toBe(4)

    s.update({x: 3})
    expect(s.value()).toEqual({x: 3})

    s.update({y: 2})
    expect(s.value()).toEqual({x: 3, y: 2})

    s.update(undefined)
    expect(s.value()).toEqual(undefined)

    s.update(d => {
        expect(d).toEqual(undefined)
    })

    s.update(3)
    expect(s.value()).toEqual(3)

    s.update({z: 2})
    expect(s.value()).toEqual({z: 2})

    s.update([])
    expect(s.value()).toEqual([])

    s.update(() => undefined)
    expect(s.value()).toEqual([])

    s.update(d => {
        d.push(3)
        return 4
    })
    expect(s.value()).toEqual(4)


    s.update(() => nothing)
    expect(s.value()).toEqual(undefined)

    s.update(() => 4)
    expect(s.value()).toEqual(4)
})

test("select fn update overloads", () => {
    const a = createStore<any>({x: "3"})
    const s = a.do(select(s => s.x))

    expect(() => {
        a.update(d => (d.x = {x: 3}))
    }).toThrow("Either return a new value")

    expect(() => {
        s.update(4)
    }).toThrow("cannot return a complety new state")

    a.update(d => {
        d.x = {x: 3}
    })
    expect(s.value()).toEqual({x: 3})

    s.update({y: 2})
    expect(s.value()).toEqual({x: 3, y: 2})

    s.update(() => undefined)
    expect(s.value()).toEqual({x: 3, y: 2})

    a.update(d => {
        d.x = undefined
    })
    expect(s.value()).toEqual(undefined)

    s.update(d => {
        expect(d).toEqual(undefined)
    })

    expect(() => {
        s.update({y: 2})
    }).toThrow("cannot return")

    expect(() => {
        s.update(d => 3)
    }).toThrow("cannot return")
})

test("updating a merge should work", () => {
    const a = createStore({
        x: 1,
        y: 2
    })
    const x = a.select("x")
    const y = a.select("y")
    const m = merge(x, y)

    m.update([3, 3]);
    expect(a.value()).toEqual({ x: 3, y: 3})

    expect(() => {
        m.update(3 as any)
    }).toThrow("updater for merge should return an array of length 2, got: '3'")

    m.update(d => {
        d[1] = { z: 3 }
    })
    expect(a.value()).toEqual({ x: 3, y: { z: 3 }})

    m.update(d => {
        d[1].z++
    })
    expect(a.value()).toEqual({ x: 3, y: { z: 4 }})

    m.update(d => [undefined, undefined])
    expect(a.value()).toEqual({ x: undefined, y: undefined})
})
