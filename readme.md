# Remmi

_Go away! Nothing to see here yet_

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
As such, immer is basically lenses, mobx, immutable data and reactive streams smooshed together.
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
* `null` safe (you can create, compose, chain lenses even when there is no backing value)


# Core concepts

## Basics 1: creating lenses

The most important concept in remmi is the concept of lenses.
Lenses allow creating materialized views on the state, and enables reading from, writing to, and reacting to changes in the materialized view.

To support these features every lens exposes the following three core methods:

1. `value()` returns the current, immutable value of the lens
2. `update(thing)` applies an update to the current lens; that is, transforms and propagetes the update to wherever the lens got it's value from. Thing can be one of the following things:
   * An [immer producer function](https://github.com/mweststrate/immer#api) where all changes that are made to the draft are applied to an immutable copy. This is the recommended way to update state
   * An object. Merges the provided object with the current object using `Object.assign`
   * A primitive value or array. Replaces the currenet state with the given value
3. `subscribe(handler)`. The handler will called automatically every time the `value` of this lens is changed

In immer, every store is a lens as well. So the simplest way to create a lens is to just create a fresh store.

```javascript
const profile$ = createStore({
      name: "Michel",
      address: {
            country: "Amsterdam"
      }
})

// subscribe
const disposer = profile$.subscribe(profile => {
      console.log(profile.address.country)
})

// update
profile$.update(draftProfile => {
      draftProfile.address.country = "The Netherlands"
})
// prints: "The Netherlands"

disposer() // cancel the subscription

// read the current value
console.log(profile$.value().address.country)
```

The post-fixing of the lens name with `$` is a recommended best practice, as it makes it easy to distinguish lenses from the values they represent. For example it prevents variable shadowing in a case like: `profile$.subscribe(profile => {... })`.

## Basics 2: creating lenses from lenses

Lenses are like materialized views in the database, they represent the latest state of the underlying data structure, and also accept updates to write data back. We can create new lenses by leveraging the `.view` method that all lenses expose:

```javascript
const address$ = profile$.do("address")

address$.subscribe(address => {
      console.log("New address is: " + JSON.stringify(address))
})

address$.update(address => {
      address.city = "Roosendaal"
})

// prints { country: "The Netherlands", city: "Roosendaal"}

profile$.update(profile => {
      profile.address.province = "Noord Brabant"
})

// prints { country: "The Netherlands", city: "Roosendaal", province: "Noord Brabant"}
```

Lenses create a view on a part of the state, and are self contained units that can be both subscribe to, and write to the state that backs the tree. Lenses are smart as they will only respond if the relevant part of the state has changed.

If you are using typescript, you will note that lenses are strongly typed. For example the following statement results in a compile errors:
 `profile$.do("hobbies")` (profile doesn't have a `"hobbies"` field).

Because lenses have a very uniform structure, testing them is issue, for example to test logic around the concept of addresses, in a unit test you could refrain from creating an entire profile object, and just create a store for the address instead: `const address$ = createStore({ country: "The Netherlands", city: "Roosendaal", province: "Noord Brabant"})`. For the consumers it doesn't matter whether a lens is a root, or a materialized view on other lenses.

# Basics 3: selectors functions

`lens.do(key)` is actually a short-hand for `lens.do(select(key))`. The `.view` method of a lens is a very generic construct which can be used to derive all kinds of new views from a lens. This is not limited to producing other lenses, but also React components as we will see later.

`select` can not be used to pick an object from the state tree, it also accepts functions. Those functions should be pure and can construct arbitrarily new values from the tree (conceptually, this is very similar to reselect or computed values in MobX). For example:

```javascript
import { createStore, select } from "remmi"

const todos$ = createStore([
      { title: "Test Remmi", done: true },
      { title: "Grok Remmi", done: false}
])

const tasksLeft$ = todos$.do(select(todos => todos.filter(todo => todo.done === false).length))

tasksLeft$.subscribe(left => { console.log("Tasks left:", left) })
todos$.update(todos => {
      todos[0].done = false
})
// prints "Tasks left: 2"
```

# Transformers

TODO: explain concept of transformes

# Basics 4: merging lenses

The `merge` function can combine multiple lenses into a new one. (It is quite comparable to `Promise.all`).
This is quite useful when you are working for example with 'foreign keys'.


```javascript
import { createStore, select, merge } from "remmi"

const app$ = createStore({
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

const testTodo$ = app$.do("todos", 0) // same as app$.do("todos").do(0)
const users$ = app$.do("users")
const testTodoWithUserName$ = testTodo$.do(
      merge(users$),
      select(([todo, users]) => ({
            ...todo,
            assignee: users[todo.assignee].name
      }))
)

console.log(testTodoWithUserName$.value()) // prints: { title: "Test Remmi", done: true, assignee: "Michel" }
```

Merge produces a lens in itself, that just combines all the values of the input lenses as array.
`.do` does not just accept a transformer; if you give it multiple once it chains them together. In other words,
`lens$.do(x).do(y)` can simple be written as `lens$.do(x, y)`

Note that this example is contrived, as the merge could also have been written using `select`.
But in big applications you might want to send only a part of your state around, and merge shows how to create a lens that combine individual pieces again.

When combining multiple lenses or merges, Remmi will make sure that the lenses update glitch-free and in the right order.

`merge` can merge lenses from multiple stores.

# Basics 5: rendering lenses

# Concepts 1: Immutable values versus events

# Concepts 2: About transactions and change propagation

# Concepts 3: Side effects versus lenses

refrain from .subscribe

# Advanced 1: Generalizing views

# Advanced 2: Overview of all built-in factories
API.md?

# Advanced 3: Models

# Advanced 4: Automatic lenses

# Advanced 5: Interoperability
  - RxJS
  - Redux


# Tips & Trics

Create transactions using update

# API

TODO: generate and link from JSDocs

---

![lenses](docs/lenses.jpg)

Lenses and immutable stores are no new concepts, but Immer adds a few fresh concepts to the list:

* Updates are very straight forward to apply tnx to [immer](https://github.com/mweststrate/immer)
* Lenses act as two-way pipes; one can write to a lens and the lens will transparently apply the changes to the original root store. This makes it possible to decouple and isolate small parts of the state and makes asynchronous process easy
* Lenses and stores share exactly the same api, which has great benefits for test
* Remmi applies efficient, glitch-free derivation concept from MobX, which makes it impossible to observe stale or inconsistent data
* All actions and derivations in Remmi are synchronous and transactional
* Remmi supports the concepts of models; this makes it possible to design very friendly APIs around a particular lens and organize the code base by-feature
* Remmi has first class integration with React. Render are optimized without needing further optimizations such as `shouldComponentUpdate`
* Remmi optionally supports transparent tracking of dependencies, avoiding the need to set up explicit subscriptions
* Remmi supports forking, cloning, replay of actions, patches and all that fancy stuff


FAQ: Will it be better than MobX? Well, that is not mine to decide :-). But my initial guess: No. And so far this is just an experimental package. It is less efficient and syntactically more verbose. However if you prefer a single-immutable-value-source of truth, with less magic. You might fancy this one.


Convenience api's
* directly pass values to update
* `select` builder or not
* multiple builders

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

* [ ] rename everything to cursor
* [ ] use hooks
* [ ] kill models?

## Later

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