import {merge, select, render } from "remmi"
import React, {Component} from 'react';

class ArrowView extends Component {
    render() {
        const {store$, arrow$} = this.props
        return merge(store$, arrow$).do(
            render(([store, arrow]) => {
                console.log("rendering arrow " + arrow.id)
                const from = store.boxes.find(b => b.id === arrow.from)
                const to = store.boxes.find(b => b.id === arrow.to)
                const [x1, y1, x2, y2] = [
                    from.x, //+ from.width/ 2,
                    from.y + 30,
                    to.x, //+ to.width / 2,
                    to.y + 30
                ]
                return <path className="arrow"
                    d={`M${x1} ${y1} L${x2} ${y2}`}
                />
            })
        )
    }
}

export default ArrowView;
