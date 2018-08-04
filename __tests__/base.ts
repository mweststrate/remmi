import {createStore, merge, select, readOnly, fork, tap} from "../src/remmi"
import { Lens } from "../src/internal";

type Loc = { x: number, y: number }

test("type inferance", () => {
    const data = {
        loc: {
            x: 3,
            y: 5
        }
    }
    const store = createStore(data)

    let d: Lens<Loc>
    d = store.view("loc")
    d = store.view(select("loc"))
    d = store.view(d => d.loc)
    d = store.view(select(d => d.loc))
    d = store.view("loc")

    {
        const a = store.view("loc")
        a.view("x")
        const b = store.view(d => d.loc)
        b.view("x")
        const c = store.view(select(d => d.loc))
        c.view("x")
        const e = store.view(select("loc"))
        e.view("x")
        const f = store.view(readOnly)
        f.view("loc")
        f.view("loc").value().x
    }

    let x: Lens<typeof data>
    x = store
    x = store.view(readOnly)


    {
        const a = store.view(d => d, "loc")
        a.view("x")
        const b = store.view(d => d, d => d.loc)
        b.view("x")
        const c = store.view(d => d, select(d => d.loc))
        c.view("x")
        const e = store.view(d => d, select("loc"))
        e.view("x")
        const f = store.view(d => d, readOnly)
        f.view("loc")
        f.view("loc").value().x
    }

    //.view(readOnly)
    //.view("loc")

    // d = store.view(d=>d, select("loc"))
    // d = store.view(d=>d, d => d.loc)
    // d = store.view(d=>d, select(d => d.loc))
    // d = store.view(d=>d, readOnly).view("loc")

})

test("read & update through lens", () => {
    const data = {
        loc: {
            x: 3,
            y: 5
        }
    }

    const store = createStore(data)
    expect(store.value()).toBe(data)
    const lens = store.view(s => s.loc)

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
    const store = createStore<any>(data)
    const lens = store.view(select(s => s.loc))
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
    const store$ = createStore(data)
    const michel$ = store$.view(s => s.users.michel)
    // const michel2$ = store$.view(select(s => s.users.michel))
    // const michelRo$ = store$.view(readOnly)

    const merger$ = merge(store$, michel$)
    const friend$ = merge(
        store$.view(select(s => s.users)), // obviously selec tis not needed here
        michel$.view(m => m.friend)
    ).view(select(([users, friend]) => users[friend]))
    const age$ = friend$.view(select(f => f.age))

    expect(friend$.value().age).toBe(10)
    age$.subscribe(age => ages.push(age))

    store$.update(s => {
        s.users.jan.age = 12
    })
    store$.update(s => {
        s.users.jan.age = 13
    })
    michel$.update(m => {
        m.friend = "piet"
    })

    expect(friend$.value()).toBe(store$.value().users.piet)

    merger$.update(([store, michel]) => {
        store.users.piet.age = 42
    })

    friend$.update(f => {
        f.age = 43
    })

    expect(ages).toEqual([12, 13, 20, 42, 43])

    expect(store$.value()).toEqual({
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
})

test("combine lenses - fields", () => {
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
    const michel = store.view(select("users"), select("michel")) // strongly typed!
    const merger = merge(store, michel)
    const friend = merge(store.view("users"), michel.view("friend")).view(
        ([users, friend]) => users[friend]
    )
    const age = friend.view("age")

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
    expect("" + friend).toMatchSnapshot()

    merger.update(([store, michel]) => {
        store.users.piet.age = 42
    })

    debugger
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
})

test("future ref", () => {
    const s = createStore({} as any)

    const values: any = []
    const michel = s.view(s => s.users).view(users => users && users.michel)
    michel.subscribe(v => values.push(v))

    s.update(s => {
        s.users = {}
    })
    s.update(s => {
        s.users["michel"] = "michel"
    })

    expect(values).toEqual(["michel"])
    expect(s.value()).toEqual({users: {michel: "michel"}})
})

test("no glitches", () => {
    const x = createStore({x: 3, y: 4})
    const sum = merge(x.view(x => x.x), x.view(y => y.y)).view(
        ([x, y]) => x + y
    )
    const values = []
    sum.subscribe(s => values.push(s))

    x.update(x => {
        x.x = 4
    })
    x.update(x => {
        x.y = 6
        x.x = 6
    })
    expect(values).toEqual([8, 12])
})

test("cleanup", () => {
    const events: string[] = []
    const x = createStore({a: {b: {c: 3}}, x: 1})
    const inc = () =>
        x.update(x => {
            x.a.b.c += 1
        })

    const a = x.view(x => {
        events.push("select a")
        return x.a
    })
    const b = a.view(x => {
        events.push("select b")
        return x.b
    })
    const c = b.view(x => {
        events.push("select c")
        return x.c
    })

    inc()

    expect(events.splice(0)).toEqual([])
    const d1 = c.subscribe(v => {
        events.push("sub c: " + v)
    })

    inc()
    expect(events.splice(0)).toEqual([
        "select a",
        "select b",
        "select c",
        "sub c: 5"
    ])

    const d2 = b.subscribe(v => {
        events.push("sub b: " + JSON.stringify(v))
    })
    inc()
    expect(events.splice(0)).toEqual([
        "select a",
        "select b",
        'sub b: {"c":6}',
        "select c",
        "sub c: 6"
    ])

    x.update((x: any) => {
        x.y = 4
    })
    expect(events.splice(0)).toEqual(["select a"])

    d1()
    inc()
    expect(events.splice(0)).toEqual(["select a", "select b", 'sub b: {"c":7}'])

    d2()
    inc()
    expect(events.splice(0)).toEqual([])
})

test("cache lenses", () => {
    const s = createStore({x: {y: {z: 4}}})
    const x = s.view("x")
    const getY = x => x.y
    const y = x.view(getY)
    const d = y.subscribe(() => {})

    const x2 = s.view("x")
    expect(x2).toBe(x)

    const y2 = x2.view(getY)
    expect(y2).toBe(y)

    d()
    const x3 = s.view("x")
    expect(x3).not.toBe(x) // ideally it would be the same, but we cannot implement that without leaking memory
})

test("async updates work fine", async () => {
    const events = []
    const s = createStore({x: 1})
    s.subscribe(s => s.x)

    s.update(d => {
        d.x++
    })
    await Promise.resolve()
    s.update(d => {
        d.x++
    })
    expect(s.value()).toEqual({x: 3})
})

test("forking", () => {
    const s = createStore({x: 1})
    const s2 = s.view(fork())
    s.update(d => {
        d.x++
    })
    expect(s.value().x).toBe(2)
    expect(s2.value().x).toBe(1)
    s2.update(d => {
        d.x = 5
    })
    expect(s.value().x).toBe(2)
    expect(s2.value().x).toBe(5)
})

test("forking - replay", () => {
    const s = createStore({x: 1})
    const s2 = s.view(fork(true))
    s.update(d => {
        d.x++
    })
    expect(s.value().x).toBe(2)
    expect(s2.value().x).toBe(1)
    s2.update(d => {
        d.x = 5
    })
    expect(s.value().x).toBe(2)
    expect(s2.value().x).toBe(5)
    s2.replay(s)
    expect(s.value().x).toBe(5)
})

test("forking - replay - erroring", () => {
    const s = createStore({x: {y: 1}})
    const s2 = s.view(fork(true))
    s.update(d => {
        delete d.x
    })
    s2.update((d: any) => {
        d.z = 2
    })
    s2.update(d => {
        d.x.y++
    })
    expect(s.value()).toEqual({})
    expect(s2.value()).toEqual({x: {y: 2}, z: 2})
    expect(() => {
        s2.replay(s)
    }).toThrowError("Cannot read property 'y' of undefined")
    expect(s.value()).toEqual({}) // z not introduced!
    expect(s2.value()).toEqual({x: {y: 2}, z: 2})
})

test("cache merge", () => {
    const s = createStore({x: {y: 1}})
    const x = s.view("x")
    const m1 = merge(s, x)
    let m2 = merge(s, x)
    expect(m2).not.toBe(m1) // not cached

    const d = m1.subscribe(() => {})
    m2 = merge(s, x)
    expect(m2).toBe(m1) // from cache

    m2 = merge(x, s)
    expect(m2).not.toBe(m1) // order matters

    m2 = merge(s, s.view("x"))
    expect(m2).toBe(m1) // from cache

    d()
    m2 = merge(s, x)
    expect(m2).not.toBe(m1) // not cached
})

test("logging", () => {
    const s = createStore({x: {y: 1}})
    const y = s.view("x", "y")
    const stub = jest.fn()
    const log = y.view(tap(stub))

    s.update(d => {
        d.x.y = 2
    }) // no update
    expect(stub.mock.calls).toMatchSnapshot()

    log.value()
    log.value() // updated twice
    expect(stub.mock.calls).toMatchSnapshot()

    const d = log.subscribe(() => {})

    s.update(d => {
        d.x.y = 3
    }) // immediate update
    expect(stub.mock.calls).toMatchSnapshot()
    d()
})
