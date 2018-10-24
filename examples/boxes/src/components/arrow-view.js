import {merge, select, render } from "remmi"
import React, {Component} from 'react';

class ArrowView extends Component {
    render() {
        const {store, arrow, arrow$} = this.props
        const boxes = store.select("boxes")
        console.dir(arrow)
        return merge(arrow$, boxes.select(arrow.from), boxes.select(arrow.to)).do(
            render(([arrow, from, to]) => {
                console.log("rendering arrowz " + arrow.id)
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
