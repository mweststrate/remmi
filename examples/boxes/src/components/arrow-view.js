import {merge, render } from "remmi"
import React from 'react';
import { boxWidth } from "../stores/domain-state"

// TODO: write as autorender, or with hooks
export default function ArrowView({arrowC, boxesC, arrow}) {
    return merge(arrowC, boxesC.select(arrow.from), boxesC.select(arrow.to)).do(
        render(([arrow, from, to]) => {
            // TODO: respond to width changes!
            console.log("rendering arrow " + arrow.id)
            const [x1, y1, x2, y2] = [
                from.x + boxWidth(from) / 2,
                from.y + 30,
                to.x + boxWidth(to) / 2,
                to.y + 30
            ]
            return <path className="arrow"
                d={`M${x1} ${y1} L${x2} ${y2}`}
            />

        })
    )
}
