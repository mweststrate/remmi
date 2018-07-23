"use strict"

import {createStore} from "../src/remmi"

function TodoModel(lens) {
    return {
        inc() {
            lens.update({ x: x.get() + 1 })
        }
    }
}

test("model 1", () => {


})