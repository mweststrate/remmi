"use strict"

import {createStore, autoLens, merge} from "../src/immer-store"

test("read & update through lens", () => {
    const data = {
        loc: {
            x: 3,
            y: 5
        }
    }

    const store = createStore(data)
    expect(store.value()).toBe(data)
    const lens = store.select(s => s.loc)

    expect(lens.value().x).toBe(3)
    const base = lens.value()
    lens.update(l => {
        l.x += 1
    })

    expect(lens.value()).not.toBe(base)
    expect(lens.value().x).toBe(4)

    expect(store.value()).not.toBe(data)
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
    expect(lens.value()).toEqual({x: 4, y: 5})
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
    expect(lens.value()).toEqual({c: 3})
    expect(values).toEqual([{x: 4, y: 5}, {x: 4, y: 6}, {a: 2}, null, {b: 3}])
})

test("read & update through proxy", () => {
    const data = {
        loc: {
            x: 3,
            y: 5
        }
    }

    const store = autoLens(createStore(data))
    expect(store.value()).toBe(data)
    const lens = store.loc

    expect(lens.x.value()).toBe(3)
    const base = lens.value()
    lens.update(l => {
        l.x += 1
    })

    expect(lens.value()).not.toBe(base)
    expect(lens.x.value()).toBe(4)

    expect(store.value()).not.toBe(data)
})

test("combine lenses", () => {
    const data = {
        users: {
            michel: {
                name: "michel",
                friend: "jan"
            },
            jan: {
                age: 10
            },
            piet: {
                age: 20
            }
        }
    }

    const ages = []
    const store = createStore(data)
    const michel = store.select(s => s.users.michel)
    const merger = merge(store, michel)
    // const friend = merger.select(([store, michel]) => store.users[michel.friend])
    const friend = merge(store.select(s => s.users), michel.select(m => m.friend)).select(([users, friend]) => users[friend])
    const age = friend.select(f => f.age)

    expect(friend.value().age).toBe(10)
    age.subscribe(age => ages.push(age))

    store.update(s => {
        s.users.jan.age = 12
    })
    store.update(s => {
        s.users.jan.age = 13
    })
    michel.update(m => {
        m.friend = "piet"
    })

    expect(friend.value()).toBe(store.value().users.piet)

    merger.update(([store, michel]) => {
        store.users.piet.age = 42
    })

    friend.update(f => {
        f.age = 43
    })

    expect(ages).toEqual([12, 13, 20, 42, 43])

    expect(store.value()).toEqual({
        users: {
            michel: {
                name: "michel",
                friend: "piet"
            },
            jan: {
                age: 13
            },
            piet: {
                age: 43
            }
        }
    })

    // TODO: test with proxy

    // TODO: test with  undefined

})

test("future ref", () => {
    const s = createStore({} as any)

    const values:any = []
    const michel = s.select(s => s.users).select(users => users && users.michel)
    michel.subscribe(v => values.push(v))

    s.update(s => {
        s.users = {}
    })
    s.update(s => {
        s.users["michel"] = "michel"
    })

    expect(values).toEqual(["michel"])
    expect(s.value()).toEqual({ users: { michel: "michel" }})
})