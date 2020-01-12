import {track, hasChanges} from "./remmi"

describe("base tracking", () => {
    test("1", () => {
        const {deps, value} = track({ a: 1 }, (_x) => 3)
        expect(value).toBe(3)
        // assumes x was returned....
        expect(hasChanges(deps, {})).toBeTruthy();
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
        expect(value).not.toBe(base.a) // DOn't like this a bit, an we auto clean this?
        expect(hasChanges(deps, base)).toBeFalsy();
        debugger;
        expect(hasChanges(deps, {a: { b: 2 }})).toBeTruthy();
        expect(hasChanges(deps, {a: 1, b: 1})).toBeTruthy();
        expect(hasChanges(deps, {a: 2})).toBeTruthy();
        expect(hasChanges(deps, {b: 2, a: base.a})).toBeFalsy();
    })

    test("4 - with grab", () => {
        const base = {a: {b: 2}}
        const {deps} = track(base, (x, grab) => {
            expect(x.a).not.toBe(base.a)
            expect(x.a).toEqual(base.a)
            expect(grab(x.a)).toBe(base.a)
        })
        expect(hasChanges(deps, base)).toBeFalsy();
        expect(hasChanges(deps, {a: { b: 2 }})).toBeTruthy();
        expect(hasChanges(deps, {a: 1, b: 1})).toBeTruthy();
        expect(hasChanges(deps, {a: 2})).toBeTruthy();
        expect(hasChanges(deps, {b: 2, a: { b: 2, c: 3 }})).toBeTruthy();
    })
})
