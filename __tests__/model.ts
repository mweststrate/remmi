"use strict"

import {createStore} from "../src/remmi"

function TodoModel(lens) {
    return {
        inc() {
            lens.update({x: lens.value().x + 1})
        }
    }
}

test("model 1", () => {})
