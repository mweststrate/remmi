# Remmi

_Efficient immutable tree observer_

## Benefits

- fast
- composable(no separation between atoms and cursors)

## Basics

## With React

## With Redux

## With Immutable trees

## With Immer

# API

# FAQ

# Roadmap

1.0

- [x] nested items
- [ ] Map support
- [ ] store debug info with path and such if needed
- [x] external grab function
- [x] distribute proxies to other contexts
- [x] recycle proxies?
- [x] support for non immutables (treat as primitives)
- [x] make isLens work, retract meta data after finish
- [ ] typings
- [x] trackStore
- [ ] trackReduxStore
- [x] don't double wrap in traking?
- [ ] document effect on hooks, updates, etc: current ftw
- [ ] `subscribe(lens, listener)`, `subscribe(() => tracker, handler?)`, and `useLens`
- [ ] `cursor(cursor, path|string)`
- [ ] `isAtom`
- [ ] `when(expr): Promise`
- [ ] `listDependencies`
- [ ] ES5 mode + warn about missing items in Proxy mode
- [ ] `wrapReducer`
- [ ] `protect(lens) -> updater` disallow external updates

  1.1

- [ ] computed / computed lens?
- [ ] autorun / when / computeds?
- [ ] trackSelector
- [ ] `act`

  1.2

- [ ] `Set` support
