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
        const boxesC = store.select("boxes")
        return (
            <div className="app">
                <div className="canvas" onClick={this.onCanvasClick}>
                    <svg>
                        {store.do(
                            select("arrows"),
                            renderAll((arrow, arrowC) => (
                                <ArrowView
                                    arrow={arrow}
                                    arrowC={arrowC}
                                    boxesC={boxesC}
                                />
                            ))
                        )}
                    </svg>
                    {boxesC.do(
                        renderAll((box, box$) => (
                            <BoxView box={box} box$={box$} store={store} />
                        ))
                    )}
                </div>
                <Sidebar store={store} />
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
