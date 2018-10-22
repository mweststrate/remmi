import {createStore, merge, select, readOnly, fork, tap} from "../src/remmi"
import {Lens} from "../src/internal"

type Loc = {x: number; y: number}

test("type inferance", () => {
    const data = {
        loc: {
            x: 3,
            y: 5
        }
    }
    const store = createStore(data)

    let d: Lens<Loc>
    d = store.select("loc")
    d = store.do(select("loc"))
    d = store.do(select(d => d.loc))
    d = store.select("loc")

    {
        const a = store.select("loc")
        a.select("x")
        const c = store.do(select(d => d.loc))
        c.select("x")
        const e = store.do(select("loc"))
        e.select("x")
        const f = store.do(readOnly)
        f.select("loc")
        f.select("loc").value().x
    }

    let x: Lens<typeof data>
    x = store
    x = store.do(readOnly)

    {
        const a = store.do(select(d => d), select("loc"))
        a.select("x")
        const b = store.do(select(d => d), select(d => d.loc))
        b.select("x")
        const e = store.do(select(d => d), select("loc"))
        e.select("x")
        const f = store.do(select(d => d), readOnly)
        f.select("loc")
        f.select("loc").value().x
        const x: number = store.select("loc", "x").value()
    }
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
    const lens = store.do(select(s => s.loc))

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
    const lens = store.do(select(s => s.loc))
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
    const michel$ = store$.do(select(s => s.users.michel))
    // const michel2$ = store$.do(select(s => s.users.michel))
    // const michelRo$ = store$.do(readOnly)

    const merger$ = merge(store$, michel$)
    const friend$ = merge(store$.select("users"), michel$.select("friend")).do(
        select(([users, friend]) => users[friend])
    )
    const age$ = friend$.do(select(f => f.age))

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
                friend: "jan",
                age: 33
            },
            jan: {
                age: 10,
                name: "jan"
            },
            piet: {
                age: 20,
                name: "piet"
            }
        }
    }

    const ages = []
    const store = createStore(data, {name: "store "})
    const michel = store.do(select("users"), select("michel")) // strongly typed!
    const merger = merge(store, michel)
    const friend = merge(store.select("users"), michel.select("friend")).do(
        select(([users, friend]) => users[friend as "piet"])
    )
    const age = friend.select("age")

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

    expect(store.value().users.piet.age).toBe(42)

    friend.update(f => {
        f.age = 43
    })

    expect(ages).toEqual([12, 13, 20, 42, 43])

    expect(store.value()).toEqual({
        users: {
            michel: {
                name: "michel",
                friend: "piet",
                age: 33
            },
            jan: {
                name: "jan",
                age: 13
            },
            piet: {
                name: "piet",
                age: 43
            }
        }
    })
})

test("future ref", () => {
    const s = createStore({} as any)

    const values: any = []
    const michel = s.do(
        select(s => s.users),
        select(users => users && users.michel)
    )
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
    const s = createStore({x: 3, y: 4})
    const sum = merge(s.select("x"), s.select("y")).do(
        select(([x, y]) => x + y)
    )
    const values = []
    sum.subscribe(s => values.push(s))

    s.update(x => {
        x.x = 4
    })
    s.update(x => {
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

    expect(x.derivations.length).toBe(1) // store has 1 default subsription!

    const a = x.do(
        select(x => {
            events.push("select a")
            return x.a
        })
    )

    expect(x.derivations.length).toBe(1)
    expect(a.derivations.length).toBe(0)

    inc()

    expect(events.splice(0)).toEqual([])

    const d1 = a.subscribe(v => {
        events.push("sub a: " + v.b.c)
    })

    expect(x.derivations.length).toBe(2)
    expect(a.derivations.length).toBe(1)

    expect(events.splice(0)).toEqual([])

    inc()
    expect(events.splice(0)).toEqual([
        "select a",
        "sub a: 5"
    ])
    d1()
    inc()

    expect(x.derivations.length).toBe(1)
    expect(a.derivations.length).toBe(0)
    expect(events.splice(0)).toEqual([])
})

test("cleanup", () => {
    const events: string[] = []
    const x = createStore({a: {b: {c: 3}}, x: 1})
    const inc = () =>
        x.update(x => {
            x.a.b.c += 1
        })

    const a = x.do(
        select(x => {
            debugger
            events.push("select a")
            return x.a
        })
    )
    const b = a.do(
        select(x => {
            events.push("select b")
            return x.b
        })
    )
    const c = b.do(
        select(x => {
            events.push("select c")
            return x.c
        })
    )

    inc()

    expect(events.splice(0)).toEqual([])
    const d1 = c.subscribe(v => {
        events.push("sub c: " + v)
    })

    expect(x.derivations.length).toBe(2)
    expect(a.derivations.length).toBe(1)
    expect(b.derivations.length).toBe(1)
    expect(c.derivations.length).toBe(1)

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

    expect(x.derivations.length).toBe(2)
    expect(a.derivations.length).toBe(1)
    expect(b.derivations.length).toBe(2)
    expect(c.derivations.length).toBe(1)

    inc()
    expect(events.splice(0)).toEqual([
        "select a",
        "select b",
        "select c",
        "sub c: 6",
        'sub b: {"c":6}'
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

    expect(x.derivations.length).toBe(1)
    expect(a.derivations.length).toBe(0)
    expect(b.derivations.length).toBe(0)
    expect(c.derivations.length).toBe(0)
})

test("cache lenses", () => {
    const s = createStore({x: {y: {z: 4}}})
    const x = s.select("x")
    const getY = x => x.y
    const y = x.do(select(getY))
    const d = y.subscribe(() => {})

    const x2 = s.select("x")
    expect(x2).toBe(x)

    const y2 = x2.do(select(getY))
    expect(y2).toBe(y)

    d()
    const x3 = s.select("x")
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
    const s2 = s.do(fork())
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
    const s2 = s.do(fork(true))
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
    const s2 = s.do(fork(true))
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
    const x = s.select("x")
    const m1 = merge(s, x)
    let m2 = merge(s, x)
    expect(m2).not.toBe(m1) // not cached

    const d = m1.subscribe(() => {})
    m2 = merge(s, x)
    expect(m2).toBe(m1) // from cache

    const m3 = merge(x, s)
    expect(m2).not.toBe(m3) // order matters

    m2 = merge(s, s.select("x"))
    expect(m2).toBe(m1) // from cache

    d()
    const m4 = merge(s, x)
    expect(m4).not.toBe(m1) // not cached
})

test("logging", () => {
    const s = createStore({x: {y: 1}}, {name: "test"})
    const y = s.select("x", "y")
    const stub = jest.fn()
    const log = y.do(tap(stub))

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
