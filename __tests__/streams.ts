import { from, interval } from "rxjs"
import { createStore, select, toStream, fromStream, connect } from "../src/remmi";

test("toStream", () => {
    const user = createStore({
        firstName: "C.S",
        lastName: "Lewis"
    })

    let values = []

    const sub = from(user)
        .subscribe(v => values.push(v))

    user.update({ firstName: "John"})
    user.update(undefined)
    user.update(3)
    sub.unsubscribe()
    user.update({test: 1})

    expect(values).toEqual([{"firstName": "John", "lastName": "Lewis"}, undefined, 3]    )
})

test("toStream", () => {
    const user = createStore({
        firstName: "C.S",
        lastName: "Lewis"
    })


    let values = []

    const sub = from(user.do(
        select("firstName"),
        toStream
    ))
        .subscribe(v => values.push(v))

    user.update({ firstName: "John"})
    user.update(undefined)
    debugger
    user.update(3)
    user.update({ firstName: "Noa"})
    sub.unsubscribe()
    user.update({ firstName: "Veria"})

    expect(values).toEqual(["John", undefined, "Noa"])
})

test("fromStream", async () => {
    const user = createStore({
        name: "michel",
        age: -1
    })
    const numberGenerator = interval(100);
    const values = []
    user.select("age").subscribe(v => values.push(v))
    const unsubscribe = user.do(select("age"), fromStream(numberGenerator))

    await delay(250)
    unsubscribe()
    await delay(250)

    expect(values).toEqual([0,1])
})

function delay(timeout) {
    return new Promise((resolve) => {
        setTimeout(resolve, timeout)
    })
}

test("connect - bidi syncs", () => {
    const store1 = createStore({
        x: 1
    })

    const store2 = createStore({
        x: 1
    })

    let disposer = store1.do(connect((subscribe, sink) => {
        subscribe(v => {
            store2.update(v)
        })

        return store2.subscribe(v => sink(v))
    }))

    store1.update({x: 2})
    expect(store2.value().x).toBe(2)

    store2.update({x: 3})
    expect(store1.value().x).toBe(3)

    disposer()

    store1.update({x: 4})
    expect(store2.value().x).toBe(3)

    store2.update({x: 5})
    expect(store1.value().x).toBe(4)
})