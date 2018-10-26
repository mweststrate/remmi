import {merge, render, autoRender } from "remmi"
import { useCursor } from "../utils"
import React from 'react';
import { boxWidth } from "../stores/domain-state"

// // With autoRender:
// export default function ArrowView({arrowC, boxesC}) {
//     return autoRender(() => {
//         const arrow = arrowC.value()
//         const from = boxesC.select(arrow.from).value()
//         const to = boxesC.select(arrow.to).value()
//         const [x1, y1, x2, y2] = [
//             from.x + boxWidth(from) / 2,
//             from.y + 30,
//             to.x + boxWidth(to) / 2,
//             to.y + 30
//         ]
//         console.log("rendering arrow " + arrow.id)
//         return <path className="arrow"
//             d={`M${x1} ${y1} L${x2} ${y2}`}
//         />
//     })
// }


export default function ArrowView({arrowC, boxesC}) {
    const arrow = useCursor(arrowC)
    const from = useCursor(boxesC.select(arrow.from))
    const to = useCursor(boxesC.select(arrow.to))
    const [x1, y1, x2, y2] = [
        from.x + boxWidth(from) / 2,
        from.y + 30,
        to.x + boxWidth(to) / 2,
        to.y + 30
    ]
    console.log("rendering arrow " + arrow.id)
    return <path className="arrow"
        d={`M${x1} ${y1} L${x2} ${y2}`}
    />
}
