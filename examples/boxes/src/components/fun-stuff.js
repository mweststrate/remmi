import React from 'react';

import {generateStuff} from '../stores/domain-state';
import * as history from '../stores/time';

export default (({store}) => (<div className="funstuff">
    <button onClick={() => generateStuff(store, 5)} title="generate 500 boxes">!</button>
    <button onClick={() => history.previousState(store)} title="previous state">&lt;</button>
    <button onClick={() => history.nextState(store)} title="next state">&gt;</button>
</div>));
