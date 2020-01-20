import {track, hasChanges, isLens} from "./remmi"

describe("base tracking", () => {
    test("1", () => {
        const {deps, value} = track({ a: 1 }, (_x) => 3)
        expect(value).toBe(3)
        expect(hasChanges(deps, {})).toBeFalsy();
    })

    test("2", () => {
        const base = {a: 1}
        const {deps, value} = track(base, x => x.a)
        expect(value).toBe(1)
        expect(hasChanges(deps, base)).toBeFalsy();
        expect(hasChanges(deps, {a: 1})).toBeFalsy();
        expect(hasChanges(deps, {a: 1, b: 1})).toBeFalsy();
        expect(hasChanges(deps, {a: 2})).toBeTruthy();
    })

    test("3", () => {
        const base = {a: 1}
        const {deps, value} = track(base, x => x.b)
        expect(value).toBe(undefined)
        expect(hasChanges(deps, base)).toBeFalsy();
        expect(hasChanges(deps, {a: 1})).toBeFalsy();
        expect(hasChanges(deps, {a: 1, b: undefined})).toBeFalsy();
        expect(hasChanges(deps, {a: 1, b: 2})).toBeTruthy();
    })

    test("4", () => {
        const base = {a: {b: 2}}
        const {deps, value} = track(base, x => x.a.b)
        expect(value).toBe(2)
        expect(hasChanges(deps, base)).toBeFalsy();
        expect(hasChanges(deps, {a: { b: 2 }})).toBeFalsy();
        expect(hasChanges(deps, {a: 1, b: 1})).toBeTruthy();
        expect(hasChanges(deps, {a: 2})).toBeTruthy();
        expect(hasChanges(deps, {b: 2, a: { b: 2, c: 3 }})).toBeFalsy();
    })

    test("return object", () => {
        const base = {a: {b: 2}}
        const {deps, value} = track(base, x => x.a)
        expect(value).toEqual(base.a)
        expect(value).not.toBe(base.a) // proxy
        expect(isLens(value)).toBeTruthy();
        expect(hasChanges(deps, base)).toBeFalsy();
        expect(hasChanges(deps, {a: { b: 3 }})).toBeFalsy(); // cause same lense is returned!
        expect(hasChanges(deps, {a: { b: 2 }})).toBeFalsy(); // cause same lense is returned!
        expect(hasChanges(deps, {a: 1, b: 1})).toBeTruthy();
        expect(hasChanges(deps, {a: 2})).toBeTruthy();
        expect(hasChanges(deps, {b: 2, a: base.a})).toBeFalsy();
    })

    test("4 - with grab", () => {
        const base = {a: {b: 2}}
        const {deps, value} = track(base, (x, grab) => {
            expect(x.a).not.toBe(base.a)
            expect(x.a).toEqual(base.a)
            expect(grab(x.a)).toBe(base.a)
            return grab(x.a)
        })
        expect(value).toBe(base.a)
        // expect(isLens(value)).toBeFalsy() // TODO:
        expect(hasChanges(deps, base)).toBeFalsy();
        expect(hasChanges(deps, {a: { b: 2 }})).toBeTruthy();
        expect(hasChanges(deps, {a: 1, b: 1})).toBeTruthy();
        expect(hasChanges(deps, {a: 2})).toBeTruthy();
        expect(hasChanges(deps, {b: 2, a: { b: 2, c: 3 }})).toBeTruthy();
    })

    test("return object with auto grab - 1", () => {
        const base = {a: {b: 2}}
        const {deps, value} = track(base, x => x.a, true)
        expect(value).toBe(base.a)
        // expect(isLens(value)).toBeFalsy() // TODO:
        expect(hasChanges(deps, base)).toBeFalsy();
        expect(hasChanges(deps, { a: base.a, b: 2})).toBeFalsy();
        expect(hasChanges(deps, {a: { b: 2 }})).toBeTruthy();
        expect(hasChanges(deps, {a: 1, b: 1})).toBeTruthy();
        expect(hasChanges(deps, {a: 2})).toBeTruthy();
        expect(hasChanges(deps, {b: 2, a: { b: 2, c: 3 }})).toBeTruthy();
    })

    test("return object with auto grab - 1", () => {
        const base = {a: {b: 2}}
        const {deps, value} = track(base, x => ({ thing: x }), true)
        expect(value.thing).toBe(base)
        expect(hasChanges(deps, base)).toBeFalsy();
        expect(hasChanges(deps, {})).toBeTruthy();
    })
})
