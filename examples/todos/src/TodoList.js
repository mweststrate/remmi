import * as React from 'react'

import { renderAll, render, model } from 'remmi'

import { Header } from './Header'
import { TodoModel } from './todoStore'

export class TodoList extends React.Component {
    render() {
        const { store$ } = this.props
        return (
            <div>
                <Header store$={store$} />
                <ul>
                    {store$.view("todos",renderAll(
                        (todo, todo$) =>
                            <Todo todo$={todo$.view(model(TodoModel))} />
                    ))}
                </ul>
            </div>
        )
    }
}

const Todo = ({ todo$ }) => todo$.view(render((todo, todo$) =>
        <li>
            <input id={`input-${todo.id}`} type="checkbox" checked={todo.done} onClick={todo$.toggle} />
            <label htmlFor={`input-${todo.id}`}>{todo.title}</label>
        </li>
))
