import React, {Component} from 'react';
import { select, renderAll } from 'remmi';

import {randomUuid} from '../utils';

import BoxView from './box-view';
import ArrowView from './arrow-view';
// import Sidebar from './sidebar';
// import FunStuff from './fun-stuff';

class Canvas extends Component {
    render() {
        const {store} = this.props;
        return (
            <div className="app">
                <div className="canvas"
                    onClick={this.onCanvasClick}
                >
                    <svg>
                        { store.do(select("arrows"), renderAll((arrow, arrow$) =>
                            <ArrowView arrow={arrow} arrow$={arrow$} store={store} key={arrow.id} />
                        )) }
                    </svg>
                    { store.do(select("boxes"), renderAll((box, box$) =>
                        <BoxView box={box} box$={box$} key={box.id} />
                    )) }
                </div>
                {/* <Sidebar store={store} /> */}
                {/* <FunStuff /> */}
            </div>
        )
    }

    onCanvasClick = (e) => {
        const {store} = this.props;
        if (e.ctrlKey === false) {
            store.selection = null;
        } else {
            const newBox = store.addBox('Hi.', e.clientX - 50, e.clientY - 20, store.selection);
            store.selection = newBox;
        }
    }
}

export default Canvas;
