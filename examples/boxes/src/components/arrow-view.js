import {merge, render } from "remmi"
import React from 'react';

// TODO: write as autorender
export default function ArrowView({arrowC, boxesC, arrow}) {
    return merge(arrowC, boxesC.select(arrow.from), boxesC.select(arrow.to)).do(
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
