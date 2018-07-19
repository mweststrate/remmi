import * as React from 'react'
import { render } from 'react-dom'

import { store$ } from './todoStore'

import { TodoList } from './TodoList'

render(<TodoList store$={store$} />, document.getElementById('root'))

store$.addTodo('Get Coffee')
store$.addTodo('Write simpler code')
store$.addTodo('Nice!')

store$.unfinishedTodoCount$.subscribe(count => {
    console.log(`${count} items left`)
})
