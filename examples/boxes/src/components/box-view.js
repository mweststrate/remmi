import {merge, render} from "remmi"
import React, {Component} from "react"
import {DraggableCore} from "react-draggable"

import {boxWidth} from "../stores/domain-state"

class BoxView extends Component {
    render() {
        const {box, box$, store} = this.props
        const isSelected = merge(box$, store.select("selection")).select(
            ([box, selection]) => box.id === selection
        )
        console.log("rendering box " + box.id)
        return isSelected.do(
            render(isSelected => (
                <DraggableCore onDrag={this.handleDrag}>
                    <div
                        style={{
                            width: boxWidth(box),
                            left: box.x,
                            top: box.y
                        }}
                        onClick={this.handleClick}
                        className={isSelected ? "box box-selected" : "box"}
                    >
                        {box.name}
                    </div>
                </DraggableCore>
            ))
        )
    }

    handleClick = e => {
        this.props.store.update(d => {
            d.selection = this.props.box.id
        })
        e.stopPropagation()
    }

    handleDrag = (e, dragInfo) => {
        this.props.box$.update(d => {
            d.x += dragInfo.deltaX
            d.y += dragInfo.deltaY
        })
    }
}

export default BoxView
