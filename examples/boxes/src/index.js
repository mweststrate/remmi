import React from 'react';
import ReactDOM from 'react-dom';

import './index.css';
import * as serviceWorker from './serviceWorker';

import Canvas from './components/canvas';
import { createBoxesStore } from './stores/domain-state';
import { trackChanges } from "./stores/time";

const store = createBoxesStore()

trackChanges(store)

ReactDOM.render(<Canvas store={store}/>, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: http://bit.ly/CRA-PWA
serviceWorker.unregister();
