import {cursor, track, isCursor} from '../remmi'
import {update, current} from '../magic'
import {simpleTest} from "./utils"


test("map basics", () => {
  const x = new Map([["a", 1]])

  simpleTest(x, s => s.get("a"), new Map([["a", 2]]), true)
  simpleTest(x, s => s.get("a"), new Map([["a", 1]]), false)
  simpleTest(x, s => s.get("a"), new Map([["a", 1], ["b", 2]]), false)
})
