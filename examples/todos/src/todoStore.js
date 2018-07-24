import { createStore, model } from 'remmi'

function TodoStore(lens) {
    return {
        get unfinishedTodoCount$() {
            return lens.view(s => s.todos.filter(todo => !todo.done).length)
        },
        addTodo(title) {
            lens.update(s => {
                s.todos.push({ title, done: false, id: Math.random() })
            })
        },
        markAllCompleted() {
            lens.update(s => {
                s.todos.forEach(todo => {
                    todo.done = true
                })
            })
        }
    }
}

export function TodoModel(lens) {
    return {
        toggle() {
            lens.update(t => {
                t.done = !t.done
            })
        }
    }
}

export const store$ = createStore({
    todos: []
}).view(model(TodoStore))