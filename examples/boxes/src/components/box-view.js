import React, {Component} from 'react';
import {DraggableCore} from 'react-draggable';

import {boxWidth} from "../stores/domain-state"

class BoxView extends Component {
    render() {
        const {box} = this.props;
        console.log("rendering box " + box.id)
        return (
            <DraggableCore onDrag={this.handleDrag}>
                <div
                    style={{
                        width: boxWidth(box),
                        left: box.x,
                        top: box.y
                    }}
                    onClick={this.handleClick}
                    className={this.isSelected ? 'box box-selected' : 'box' }
                >
                    {box.name}
                </div>
            </DraggableCore>
        )
    }

    handleClick = (e) => {
        // TODO:  this.props.store.selection = this.props.box;
        e.stopPropagation();
    }

    handleDrag = (e, dragInfo) => {
        this.props.box$.update(d => {
            d.x += dragInfo.deltaX;
            d.y += dragInfo.deltaY;
        })
    }

    get isSelected() {
        // TODO:
        // return this.props.store.selection && this.props.store.selection.id === this.props.box.id;
    }
}

export default BoxView;
