import * as React from 'react'

import { project, mapProject, Project } from 'remmi'
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
                    {store$.select("todos").renderAll(
                        (todo, todo$) => <Todo todo$={todo$} />
                    )}
                </ul>
            </div>
        )
    }
}

const Todo = ({ todo$ }) => {
    return todo$.render(todo =>
            <li>
                <input id={`input-${todo.id}`} type="checkbox" checked={todo.done} onClick={toggle.bind(null, todo$)} />
                <label htmlFor={`input-${todo.id}`}>{todo.title}</label>
            </li>
    )
}
