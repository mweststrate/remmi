import * as React from 'react'
import { render } from 'react-dom'

import { store$, unfinishedTodoCount$, addTodo } from './todoStore'

import { TodoList } from './TodoList'

render(<TodoList store$={store$} />, document.getElementById('root'))

addTodo(store$, 'Get Coffee')
addTodo(store$, 'Write simpler code')

unfinishedTodoCount$.subscribe(count => {
    console.log(`${count} items left`)
})
