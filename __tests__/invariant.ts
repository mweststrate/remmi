import {createStore, invariant} from "../src/remmi"

test("invariant - 1", () => {
    const s = createStore({x: 3})
    const aSeen = []
    s.subscribe(d => {
        aSeen.push(d)
    })
    const d = s.do(invariant(s => s.x === 3))

    expect(() => {
        s.update(d => {
            d.x = 4
        })
    }).toThrow("Invariant failed: 'function (s) {return s.x === 3;}'")

    const bSeen = []
    s.subscribe(d => {
        bSeen.push(d)
    })

    d()

    s.update(d => {
        d.x = 5
    })

    expect(aSeen).toEqual([{x: 4}, {x: 5}])
    expect(bSeen).toEqual([{x: 5}])
})

test("invariant - 2", () => {
    const s = createStore({z: {x: 3}})
    const aSeen = []
    const x$ = s.select("z", "x")
    x$.subscribe(d => {
        aSeen.push(d)
    })
    const d = x$.do(invariant(s => s === 3))

    expect(() => {
        s.select("z").update(d => {
            d.x = 4
        })
    }).toThrow("Invariant failed: 'function (s) {return s === 3;}'")

    const bSeen = []
    x$.subscribe(d => {
        bSeen.push(d)
    })

    d()

    s.select("z").update(d => {
        d.x = 5
    })

    expect(aSeen).toEqual([4, 5])
    expect(bSeen).toEqual([5])
})
