import React from 'react';

import {v4} from 'node-uuid';

export function randomUuid() {
    return v4();
}

// TODO: for whathever reason, hooks don't work when exported from the immer package :'(
// Probably build issue, need to figure out later

export function useCursor(cursor) {
    function update(v) { setValue(v) }
    React.useEffect(() => cursor.subscribe(update), [cursor])
    const [value, setValue] = React.useState(() => cursor.value())
    return value
}
