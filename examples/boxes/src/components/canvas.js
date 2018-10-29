import React, {Component} from "react"
import {select, renderAll} from "remmi"
import { useCursor } from "../utils"

import {createArrow,  createBox } from "../stores/domain-state"
import BoxView from "./box-view"
import ArrowView from "./arrow-view"
import Sidebar from './sidebar';
import FunStuff from './fun-stuff';

class Canvas extends Component {
    render() {
        const {store} = this.props
        const boxesCursor = store.select("boxes")
        const selection = store.select(s => s.boxes[s.selection])
        return (
            <div className="app">
                <div className="canvas" onClick={this.onCanvasClick}>
                    <svg>
                        {store.do(
                            select("arrows"),
                            renderAll((arrow, arrowCursor) => (
                                <ArrowView
                                    arrowCursor={arrowCursor}
                                    boxesCursor={boxesCursor}
                                />
                            ))
                        )}
                    </svg>
                    {boxesCursor.do(
                        renderAll((box, boxCursor) => (
                            <BoxView box={box} boxCursor={boxCursor} store={store} />
                        ))
                    )}
                </div>
                <Sidebar selection={selection} />
                <FunStuff store={store} />
            </div>
        )
    }

    onCanvasClick = e => {
        const {store} = this.props
        if (e.ctrlKey === true && store.value().selection) {
            store.update(draft => {
                const id = createBox(store, "Hi.",  e.clientX - 50,
                    e.clientY - 20)
                createArrow(store, store.value().selection, id)
                draft.selection = id
            })

        }
    }
}

export default Canvas
