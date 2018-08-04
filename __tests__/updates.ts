import {createStore, merge, select} from "../src/remmi"

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
    }).toThrow("Updater functions should not return")
    expect(s.value()).toEqual([])

})

test("select field update overloads", () => {
    const a = createStore<any>({ x: "3" })
    const s = a.view("x")

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

    expect(() => {
        s.update(d => {
            d.push(3)
            return 4
        })
    }).toThrow("Updater functions should not return")
    expect(s.value()).toEqual([])
})


test("select fn update overloads", () => {
    const a = createStore<any>({ x: "3" })
    const s = a.view(select(s => s.x))

    expect(() => {
        s.update(4)
    }).toThrow("not reassignable")

    expect(() => {
        a.update(d => d.x = {x: 3} )
    }).toThrow("should not return values")

    a.update(d => {
         d.x = {x: 3}
    })
    expect(s.value()).toEqual({x: 3})

    s.update({y: 2})
    expect(s.value()).toEqual({x: 3, y: 2})

    s.update(() => undefined)
    expect(s.value()).toEqual({x: 3, y: 2})

    a.update(d => { d.x = undefined })
    expect(s.value()).toEqual(undefined)

    s.update(d => {
        expect(d).toEqual(undefined)
    })

    expect(() => {
        s.update({ y: 2})
    }).toThrow("not reassignable")

    expect(() => {
        s.update(d => 3)
    }).toThrow("Updater functions should not return")
})

// TODO: select fn then select field


// TODO: merge then select field


// TODO: replay
