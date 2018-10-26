import {select, render} from "remmi"
import React, {Component} from "react"

class Sidebar extends Component {
    render() {
        const {store} = this.props
        return store.do(
            select("selection"),
            render(
                selectionId =>
                    selectionId ? (
                        store.do(
                            select("boxes"),
                            select(selectionId),
                            render(box => (
                                <div className="sidebar sidebar-open">
                                    <input
                                        onChange={this.onChange}
                                        value={box.name}
                                    />
                                </div>
                            ))
                        )
                    ) : (
                        <div className="sidebar" />
                    )
            )
        )
    }

    onChange = e => {
        this.props.store.update(d => {
            if (d.selection) d.boxes[d.selection].name = e.target.value
        })
    }
}

export default Sidebar
