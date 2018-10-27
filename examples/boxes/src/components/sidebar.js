import {select, render} from "remmi"
import React, {Component} from "react"

class Sidebar extends Component {
    render() {
        const {selection} = this.props
        return selection.do(
            render(
                box =>
                    box ? (
                        <div className="sidebar sidebar-open">
                            <input onChange={this.onChange} value={box.name} />
                        </div>
                    ) : (
                        <div className="sidebar" />
                    )
            )
        )
    }

    onChange = e => {
        this.props.selection.update(draft => {
            draft.name = e.target.value
        })
    }
}

export default Sidebar
