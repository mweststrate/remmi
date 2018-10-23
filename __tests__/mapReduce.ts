import { createStore, map } from "../src/remmi";
import { shallowDiff } from "../src/internal";

test("shallow diff", () => {
    expect(shallowDiff([], ["a", "b"])).toEqual({
        added: [["0", "a"], ["1", "b"]],
        removed: [],
        changed: []
    })
})

test("map add - cold", () => {
    const events: string[] = []

    const store = createStore([
        "hello",
        "world"
    ])

    const upperCased = store.do(map((value: string, index) => {
        events.push(`running on ${index}: ${value}`)
        return value.toUpperCase()
    }))

    expect(events.splice(0)).toEqual([

    ])

    expect(upperCased.value()).toEqual([
        "HELLO",
        "WORLD"
    ])
    expect(events.splice(0)).toEqual([
        "running on 0: hello",
        "running on 1: world",
    ])

    store.update(d => void d.push("hi"))
    expect(upperCased.value()).toEqual([
        "HELLO",
        "WORLD",
        "HI"
    ])
    expect(events.splice(0)).toEqual([
        "running on 0: hello", // cold, recomputed!
        "running on 1: world", // cold, recomputed!
        "running on 2: hi",
    ])
})


test("map add - hot", () => {
    const events: string[] = []

    const store = createStore([
        "hello",
    ])

    const upperCased = store.do(map((value: string, index) => {
        events.push(`running on ${index}: ${value}`)
        return value.toUpperCase()
    }))

    expect(events.splice(0)).toEqual([

    ])

    upperCased.subscribe((v) => {
        events.push(v.join("|"))
    })

    store.update(d => void d.push("world"))
    expect(upperCased.value()).toEqual([
        "HELLO",
        "WORLD",
    ])
    expect(events.splice(0)).toEqual([
        "running on 0: hello",
        "running on 1: world",
        "HELLO|WORLD",
    ])

    store.update(d => void d.push("hi"))
    expect(upperCased.value()).toEqual([
        "HELLO",
        "WORLD",
        "HI"
    ])
    expect(events.splice(0)).toEqual([
        "running on 2: hi",
        "HELLO|WORLD|HI",
    ])

    store.update(d => {
        d[1] = "universe"
    })
    expect(upperCased.value()).toEqual([
        "HELLO",
        "UNIVERSE",
        "HI"
    ])
    expect(events.splice(0)).toEqual([
        "running on 1: universe",
        "HELLO|UNIVERSE|HI",
    ])

    store.update(d => {
        d.length -= 1
    })
    expect(upperCased.value()).toEqual([
        "HELLO",
        "UNIVERSE"
    ])
    expect(events.splice(0)).toEqual([
        "HELLO|UNIVERSE",
    ])
})


test("map object - add - hot", () => {
    const events: string[] = []

    const store = createStore<any>({
        greet: "hello"
    })

    const upperCased = store.do(map((value: string, index) => {
        events.push(`running on ${index}: ${value}`)
        return value.toUpperCase()
    }))

    expect(events.splice(0)).toEqual([

    ])

    upperCased.subscribe((v) => {
        events.push(JSON.stringify(v))
    })

    store.update(d => {
        d.who = "world"
    })
    expect(upperCased.value()).toEqual({
        greet: "HELLO",
        who: "WORLD",
    })
    expect(events.splice(0)).toEqual([
        "running on greet: hello",
        "running on who: world",
        "{\"greet\":\"HELLO\",\"who\":\"WORLD\"}",
    ])

    store.update(d => {
        d.x = "hi"
    })
    expect(upperCased.value()).toEqual(
        {"greet": "HELLO", "who": "WORLD", "x": "HI"}
    )
    expect(events.splice(0)).toEqual([
        "running on x: hi",
        "{\"greet\":\"HELLO\",\"who\":\"WORLD\",\"x\":\"HI\"}",
    ])

    store.update(d => {
        d.who = "universe"
    })
    expect(upperCased.value()).toEqual({"greet": "HELLO", "who": "UNIVERSE", "x": "HI"})
    expect(events.splice(0)).toEqual([
        "running on who: universe",
        "{\"greet\":\"HELLO\",\"who\":\"UNIVERSE\",\"x\":\"HI\"}",
    ])

    store.update(d => {
        delete d.greet
    })
    expect(upperCased.value()).toEqual({"who": "UNIVERSE", "x": "HI"})
    expect(events.splice(0)).toEqual([
        "{\"who\":\"UNIVERSE\",\"x\":\"HI\"}",
    ])
})


test.skip("map, update", () => {
    const x = createStore([
        { count: 1}
    ])

    const mapped = x.do(map(v => v))
    const mappedFirst = mapped.select(0)
    expect(mappedFirst.value()).toEqual({ count: 1})

    mappedFirst.update(d => {
        d.count++
    })

    expect(x.value()).toEqual([{count: 2}])
    expect(mapped.value()).toEqual([{count: 2}])
    expect(mappedFirst.value()).toEqual({count: 2})

    mappedFirst.update(3)
    expect(x.value()).toEqual([3])
    expect(mapped.value()).toEqual([3])
    expect(mappedFirst.value()).toEqual(3)
})