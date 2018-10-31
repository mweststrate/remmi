# Remmi

_Materialized views for immutable data_

<a href="https://www.buymeacoffee.com/mweststrate" target="_blank"><img src="https://www.buymeacoffee.com/assets/img/custom_images/orange_img.png" alt="Buy Me A Coffee" style="height: auto !important;width: auto !important;" ></a>If you think Remmi is an idea worth pursuing, encourage me with coffee :-). Or even better: discuss it with me over a real one the next opportunity!


# Introduction

Remmi is a library to create materialized views on top of immutable data.
Granted, they are no materialized, but you conceptually Remmi works like a materialized view in the database on top of your immutable state tree:

1. Derive data from an immutability based state tree
2. Any future changes in the source state tree will automatically be reflected in the view
3. Any writes made to the view will not update the view, but write-through and update the original state instead.

Where [immer](https://github.com/mweststrate/immer) solves the problem of "how to update a deep, immutable state tree in a convenient way",
_remmi_ solves the opposite way: "given a deep, immutable state tree, how to create reactive, bi-directional views that observe the immutable state?".
As such, immer is basically cursors, mobx, immutable data and reactive streams smooshed together, helping you to transform your immutable data tree into something else, as reactively as possible.

Note that "view" on the original state can be interpreted here in it's broadest term: derived data, UI (like React or lithtml), outgoing or incoming data streams or even OO-like data models!

# Features

* Single value, immutable state tree
* Fully reactive
* Transactional, atomic updates
* Strongly typed
* First class support for async processes
* Mostly simple function composition
* Extremely extensible, please share and publish your own transformers!
* `this`-less
* `null` safe (you can create, compose, chain cursors even when there is no backing value)


# Core concepts

## About cursors

The most important concept in remmi is the concept of cursors.
Lenses allow creating materialized views on the state, and enables reading from, writing to, and reacting to changes in the materialized view.

To support these features every lens exposes the following four core methods:

1. `value()` returns the current, immutable value of the lens
2. `update(thing)` applies an update to the current lens; that is, transforms and propagetes the update to wherever the lens got it's value from. Thing can be one of the following things:
   * An [immer producer function](https://github.com/mweststrate/immer#api) where all changes that are made to the draft are applied to an immutable copy. This is the recommended way to update state
   * An object. Merges the provided object with the current object using `Object.assign`
   * A primitive value or array. Replaces the currenet state with the given value
3. `subscribe(handler)`. The handler will called automatically every time the `value` of this lens is changed
4. `do(transformations)`. Transforms the cursor into something else, more on that later!

## Creating a store

The simplest way to get started with Remmi is to create a store using `createStore`.
`createStore` create a very special cursor, one that actually holds state.
But basically, that is just an implementation detail, and you will interact with it like any other cursor.

```javascript
import { createStore } from "remmi"

const profileCursor = createStore({
      name: "Michel",
      address: {
            country: "Amsterdam"
      }
})

// subscribe
const disposer = profileCursor.subscribe(profile => {
      console.log(profile.address.country)
})

// update
profileCursor.update(draftProfile => {
      draftProfile.address.country = "The Netherlands"
})
// prints: "The Netherlands"

disposer() // cancel the subscription

// read the current value
console.log(profileCursor.value().address.country)
```

The post-fixing of the lens name with `Cursor` is a recommended best practice, as it makes it easy to distinguish cursors from the values they represent. For example it prevents variable shadowing in a case like: `profileCursor.subscribe(profile => {... })`.

## Selecting data with cursors

Cursors are like materialized views in the database, they represent the latest state of the underlying data structure, and also accept updates to write data back. We can create new cursors by leveraging the `.do` method that all cursors expose, and passing in a `select` transformation, which grabs the `"address"` field from the profile and creates a cursor for that:

```javascript
import { select } from "remmi"

const addressCursor = profileCursor.do(select("address"))

addressCursor.subscribe(address => {
      console.log("New address is: " + JSON.stringify(address))
})

addressCursor.update(address => {
      address.city = "Roosendaal"
})

// prints { country: "The Netherlands", city: "Roosendaal"}

profileCursor.update(profile => {
      profile.address.province = "Noord Brabant"
})

// prints { country: "The Netherlands", city: "Roosendaal", province: "Noord Brabant"}
```

Cursors create a view on a part of the state, and are self contained units that can be both subscribe to, and write to the state that backs the tree.
Cursors are smart as they will only respond if the relevant part of the state has changed.

Cursors evaluate lazily, so they won't actually do any work until you start pulling values from them!

If you are using typescript, you will note that lenses are strongly typed. For example the following statement results in a compile errors:
 `profileCursor.do("hobbies")` (profile doesn't have a `"hobbies"` field).

_Tip: Because `select` is so common, there is a shortcut: `select` can be called directly as function on a cursor `profileCursor.select("address")`_

## Selector functions

The `select` transformation is not limited to just plucking fields from another cursor,
they can be used to derive all kinds of new views from a lens.
For that purpose `select` also accepts functions.
Those functions should be pure and can construct arbitrarily new values from the tree (conceptually, this is very similar to reselect or computed values in MobX). For example:

```javascript
import { createStore, select } from "remmi"

const todosCursor = createStore([
      { title: "Test Remmi", done: true },
      { title: "Grok Remmi", done: false}
])

const tasksLeftCursor = todosCursor.do(select(
      todos => todos.filter(todo => todo.done === false).length
))

tasksLeftCursor.subscribe(left => { console.log("Tasks left:", left) })

todosCursor.update(todos => {
      todos[0].done = false
})
// prints "Tasks left: 2"
```

## Transformers

The `.do` can be used to transform the cursors value into something else.
Multiple transformers can be passed to `.do`, where the input of one is piped into the other, making it very similar to for example `Observable.pipe` in RxJS.

Built in transformers are:
* `all` - transforms a cursor that produces a collection (object or array) to a cursor of cursors, where each cursor forms the cursor of a field of the object
* `connect` - connects a cursor to an external resources, and sets up an uni- or bi-directional connection to read new values from, and push new values to the external resource
* `filter` - given a predicate filters over a collection. This is more efficient as as a `select` which uses `Array.filter`, as `mapReduce` is used under the hood, causing unmodified entries not to be re-processed
* `fork` - creates a new cursor that has it's own state, which is initially the same as the old cursor's value. After forking, the forked cursor will keep track of all updates that are applied, and provides the possibility to play them back onto the original cursor
* `fromStream` - Given an observable stream, reads all values from the stream and use it to update the cursor
* `keys` - Produces all the keys of a collection, similar to `Object.keys`
* `map` - maps over a collection, leveraging `mapReduce` under the hood to efficiently reuse mappings that weren't affected by an update
* `readOnly` - transforms the current cursor into a read only cursor, which can be read from, but not written to
* `render` - transforms the current cursor into a React component, that automatically keeps track of future updates to the cursor
* `renderAll` - similar, but maps over a collection and produces a rendering per item in the collection
* `select` - selects or produces a new value from the current state
* `shallowEqual` - turns the cursor into a cursor that ignore updates that are shallowly equal to the previous value. Mostly useful after `select`
* `subscribe` - subscribe a callback to listen to future cursor updates. `cursor.subscribe` can be used as shorthand
* `tap` - tap into the stream, and prints a log message each time the cursor updates
* `toStream` - creates an observable stream from the current cursor

## Merging lenses

The `merge` function can combine multiple lenses into a new one. (It is quite comparable to `Promise.all`).
This is quite useful when you are working for example with 'foreign keys'.


```javascript
import { createStore, select, merge } from "remmi"

const appCursor = createStore({
      todos: [
            { title: "Test Remmi", done: true, assignee: "24" },
            { title: "Grok Remmi", done: false }
      ],
      users: {
            "24": {
                  name: "Michel"
            }
      }
})

const firstTodoCursor = app.select("todos").select(0)
const usersCursor = app.select("users")

const assigneeNameCursor =
      merge(usersCursor, firstTodoCursor),
      select(([users, todo]) =>
            todo.assignee ? users[todo.assignee].name : undefined
      )

console.log(assigneeNameCursor.value())
// prints: "Michel"
```

Merge produces a lens in itself, that just combines all the values of the input lenses as array.

Note that this example is contrived, as the merge could also have been written using `select`.
But in big applications you might want to send only a part of your state around, and merge shows how to create a lens that combine individual pieces again.

When combining multiple lenses or merges, Remmi will make sure that the lenses update glitch-free and in the right order.

`merge` can merge lenses from multiple stores.

# Detailed semantics

## State versus Events

Immer might look like a cross-over between reactive streams and lenses.
Which is correct.
The pipe and subscription mechanism are similar to reactive streams.
The differences however, is that conceptually Remmi cursors are designed to
transform _state_, while reactive streams reason over events and time.

The two have good compatability, but the choose for either of both should based be on the question whether you want to capture either:
* The current state of the application, molding it in different values if needed
* The events that happened over time, and reasoning about events to produce side effects

## Cold and Hot cursors

Like streams, a cursor can be either `hot` or `cold`.
Hot means that there is a subscription that directly or indirectly depends on the current value of the cursor.
A cursor is `cold` if there is no such subscriptions.
Cold cursors are inefficient to read from, as they don't subscribe to their base cursors either (to prevent memory leaks).
So avoid reading `.value()` from a cursor that is cold!

## Transactions

Cursor automatically apply a transaction per `.update()` call, subscribers are only updates ones the `.update` call finishes.
If there are multiple nested `.update` calls, subscribers will only be notified once the outer one finishes.
A useful trick is to use `.update`, even without draft, to group multiple updates together, for example:

```javascript

storeCursor.update(() => {
      // without the wrapping update subscribers would be notified of a new state three times
      const id1 = createBox(storeCursor, "Roosendaal", 100, 100)
      const id2 = createBox(storeCursor, "Prague", 650, 300)
      const id3 = createBox(storeCursor, "Tel Aviv", 150, 300)
})

export function createBox(storeCursor, name, x, y) {
    const id = randomUuid()
    storeCursor.update(d => {
        d.boxes[id] = { id, name, x, y }
    })
    return id
}
```

All subscribres are notified synchronosly as soon as a transaction ends, so, like in MobX update effects are immediately visible.

Updates are glitch free; that means that, when for example a `merge` is used to combine two lenses, and both lenses are updated, the `merge` will only run once, with both the updated values, and not for any intermediate state.

## Testing lenses

Because lenses have a very uniform structure, testing them is issue, for example to test logic around the concept of addresses, in a unit test you could refrain from creating an entire user profile object, and just create a store for the address instead: `const addressCursor = createStore({ country: "The Netherlands", city: "Roosendaal", province: "Noord Brabant"})`. For the consumers of a cursor it doesn't matter whether a cursor is created using `createStore`, or using `select`, they will behave the same.

# Recipes

# Advanced 5: Interoperability
  - RxJS
  - Redux




# API

TODO: generate and link from JSDocs

---

FAQ: Will it be better than MobX? Well, that is not mine to decide :-). But my initial guess: No. And so far this is just an experimental package. It is less efficient and syntactically more verbose. However if you prefer a single-immutable-value-source of truth, with less magic. You might fancy this one.

---

# Recipes

- Read from websocket - https://codesandbox.io/s/o7y0mrvy86
- Bidirectional sink between stores (unit test)
- store from mouse handler - https://codesandbox.io/s/74252r73nq
- Subscribe to reactive streams (unit tests)
- simple example
- references
- testing a lens (model)
- async process
- connect to db
* [ ] something cool with lithtml
* [ ] Build something cool with https://codesandbox.io/s/m5lkpjm5mj
* [ ] graphql
* [ ] streams


### connect to a redux store

```javascript
const remmiStore = createStore(reduxStore.getState())

// uni-directional sink (Redux -> Remmi)
const cancel = remmiStore.do(
      connect((_, sink) => reduxStore.subscribe(sink))
)

// bi-directional sink
const cancel = remmiStore.do(
      connect((subcribe, sink) => {
            // dispatch action if remmiStore was updated
            subcribe(newState => {
                  reduxStore.dispatch({
                        type: "REPLACE_THIS_AND_THAT",
                        payload: newState
                  })
            })

            // sink Redux to Remmi
            return reduxStore.subscribe(sink)
      })
)
remmiStore.select("users").subscribe(/*etc */)

cancel() // stop syncing
```
---

# Gotchas

* optimize: don't create selectors inline
* don't accidentally return, like: `lens.update(x => x.y += 2)`
* using `nothing` from immer

# Credits

Remmi stands on the shoulders of giants (which is a nice way of saying: Remmi just stole ideas left and right):
* Materialized views in databases (see also: [turning the database inside out](https://www.youtube.com/watch?v=fU9hR3kiOK0))
* Reactive streams like RxJS as immutable data distributing mechanism
* Lense libraries (like baobab) to create a partially view on the state
* MobX for reactive, sychnronous, atomic, glitchfree distribution of changes using a dependency tree
* MobX-state-tree for providing models around immutable state

# Things to do

* [ ] warn on cold reads
* [ ] kill models?
* [ ] kill change propagation model?
* [ ] multiple args to select
* [ ] write and generate documents
* [ ] use hooks

## Later

* [ ] join?
* [ ] `.all()`, `.renderAll()` and `.mapReduce()` should detect splices (and not pass keys for arrays to handlers).
* [ ] api to subscribe to patchespatch subscriptoin
* [ ] separate export for react bindings
* [ ] separate export for all views?
* [ ] symbol supports (primitive, json etc)
* [ ] nicer toStrings
* [ ] generators: connect(generator), toGenerator: async* fn
* [ ] fix optimization and todo comments

# Summary

A designer can mull over complicated designs for months. Then suddenly the simple, elegant, beautiful solution occurs to him. When it happens to you, it feels as if God is talking! And maybe He is.

— Leo Frankowski