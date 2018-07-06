import * as React from 'react'

import { project, mapProject } from './remmi'
import { Header } from './Header'
import { toggle } from './todoStore'

export class TodoList extends React.Component {
    render() {
        console.log('render list$')
        const { store$ } = this.props
        return (
            <div>
                <Header store$={store$} />
                <ul>
                    {mapProject(store$.select(s => s.todos), (todo, idx, todo$) => (
                        <Todo key={todo.id} todo$={todo$} />
                    ))}
                </ul>
            </div>
        )
    }
}

const Todo = ({ todo$ }) => {
    console.log('render todo$ ' + todo$.value().id)
    return project(todo$, ([todo]) => {
        console.log('render todo ' + todo.id)
        return (
            <li>
                <input id={`input-${todo.id}`} type="checkbox" checked={todo.done} onClick={toggle.bind(null, todo$)} />
                <label htmlFor={`input-${todo.id}`}>{todo.title}</label>
            </li>
        )
    })
}
