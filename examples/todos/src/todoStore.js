import { createStore } from 'remmi'

export const store$ = createStore({
    todos: []
})

export const unfinishedTodoCount$ = store$.select(s => s.todos.filter(todo => !todo.done).length)

export function addTodo(store$, title) {
    store$.update(s => {
        s.todos.push({ title, done: false, id: Math.random() })
    })
}

export function markAllCompleted(store$) {
    store$.update(s => {
        s.todos.forEach(todo => {
            todo.done = true
        })
    })
}

export function toggle($todo) {
    $todo.update(t => {
        t.done = !t.done
    })
}
