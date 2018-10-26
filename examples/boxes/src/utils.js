import React from 'react';

import {v4} from 'node-uuid';

export function randomUuid() {
    return v4();
}

// TODO: for whathever reason, hooks don't work when exported from the immer package :'(
// Probably build issue, need to figure out later
export function useCursor(cursor) {
    function updater(value) {
        setValue(value)
    }
    // subscribe to the cursor
    const lensSubscription = React.useMemo(() => cursor.subscribe(updater), [cursor])
    // unsubscribe the hook
    React.useEffect(() => lensSubscription, [])
    // compute value (after subscribing to avoid re-evaluation!)
    const [value, setValue] = React.useState(() => cursor.value())
    return value
}
