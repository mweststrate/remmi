import store, {serializeState, deserializeState} from './domain-state';

var states = [];
var currentFrame = -1;
let undoing = false

export function trackChanges(store) {
    store.subscribe(state => {
        if (!undoing) {
            states.splice(++currentFrame)
            states.push(state)
        }
    })
}

export function previousState(store) {
    if (currentFrame > 1) {
        currentFrame--;
        undoing = true
        store.update(() => states[currentFrame])
        undoing = false
    }
}

export function nextState(store) {
    if (currentFrame < states.length -1) {
        currentFrame++;
        undoing = true
        store.update(() => states[currentFrame])
        undoing = false
    }
}
