# Remmi

_Immutable data + bidirection lenses = materialized reactive views_

_Go away! Nothing to see here yet_

Remmi is a fresh take on data flow and state management by very explicitly deliniating the concepts of [values and identities](https://www.youtube.com/watch?v=Gyp2QDr7YkU).
Basically it is a weird mix of the concepts of lenses, streams and goodies from mobx like glitch free derivation graphs (and optionally transparent tracking).

Conceptually Remmi allows you to build a set of lenses and prismas.
One can create an unlimited amount and complex trees of lenses, but in the end they reflect just different views on one central, immutable value: the state of the store.

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

Is it better than MobX? Well, that is not mine to decide :-). But my initial guess: No. And so far this is just an experimental package. It is less efficient and syntactically more verbose. However if you prefer a single-immutable-value-source of truth, with less magic. You might fancy this one.

# Core cencept

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
const testTodoWithUserName$ = merge(testTodo$, users$).do(select(
      ([todo, users]) => ({
            ...todo,
            assignee: users[todo.assignee].name
      })
))

console.log(testTodoWithUserName$.value) // prints: { title: "Test Remmi", done: true, assignee: "Michel" }
```

Merge produces a lens in itself, that just combines all the values of the input lenses as array.
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


---

Convenience api's
* directly pass values to update
* `select` builder or not
* multiple builders

---

Recipes

- simple example

- references

- testing a lens (model)

- async process


- connect to db

---

Gotchas

* optimize: don't create selectors inline
* don't accidentally return, like: `lens.update(x => x.y += 2)`

TODO

* [ ] nice names in api
* [ ] accurate typings
* [ ] separate bindings
* [ ] symbol supports (primitive, observable, json etc)
* [ ] nice toStrings
* [ ] create store from externally stored state e.g. (`createStore(() => this.state, this.setState)`
* [ ] custom lens creating:
      * createLensType({ name: string, onCompute, onUpdate, onSuspend, chainable: true })
* [x] model api
* [x] log lens
* [ ] funny api?
* [ ] separate export for react bindings
* [ ] read only lens
* [ ] patch subscriptoin
* [ ] reflection: show lenses base tree; patches
* [ ] optimistic lens?
* [ ] api for patches?
* [ ] from resource (at root or in tree) example
* [ ] example promise model
* [ ] merge toStream / fromStream support?
* [ ] fix all the tostrings
* [ ] make toString() better reflect actual call description
* [ ] form / to stream?
* [ ] memoized map / filter
* [ ] `by` and `groupBy`
* [ ] obtain parent or DI mechanism? (or use model closures for that?)
* [ ] parallelel pipe / lenses mechanism?
* [ ] patch stream from lens?
* [ ] diff stream from lens?
* [ ] be able to reject status during propagate of update?
* [ ] merge as view?
* [ ] computed / autorun as view?
* [ ] deepEqual selector
* [ ] redux pipe
* [ ] generator pipe