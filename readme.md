# Remmi

_Go away! Nothing to see here yet_

___

# Why

1. immutable
1. mutable syntax updates thnx to immer
1. plain js structures
1. view oriented
1. Glitch free
1. straightforward async processes
1. atomic transaction

---

# Design

Counter part of immer

Everything is a lens

Store as truth

lenses vs values

lenses as identities (React amsterdam talk link)

Inspiration: mobx derivations, immer convenience, redux state

efficient (but not as efficient as mobx proably)

---

Level 1: creating lenses

Level 2: subscribing

Level 3: merging lenses

level 4: with react

level 5: with react and di

Level 6: auto lenses (modern browsers only)

Level 7: redux compatibility?

level 8: models; views & actions?

level 9: patches?

level 10: testing: stubbing lenses etc

---

Recipes

- simple example

- async process

- references

- connect to db

---

TODO

* [ ] project setup
* [ ] transactional
* [ ] record / replay (fork / rebase) api's
* [ ] readonly
* [ ] accurate typings
* [ ] separate bindings
* [ ] symbol supports (primitive, observable, json etc)
* [ ] nice toStrings
* [ ] create store from externally stored state e.g. (`createStore(() => this.state, this.setState)`
* [ ] `call` api `call(store$, addTodo)`