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
                    <Project>
                        {() => <React.Fragment>
                            {store$.select("todos").value().map((todo, idx) => <Todo key={idx} todo$={store$.select('todos').select(idx)} />)}
                        </React.Fragment>}
                    </Project>
                </ul>
            </div>
        )
    }
}

const Todo = ({ todo$ }) => {
    return <Project>{
        () => {
            const todo = todo$.value()
            // console.dir(todo)
            return <li>
                <input id={`input-${todo.id}`} type="checkbox" checked={todo.done} onClick={toggle.bind(null, todo$)} />
                <label htmlFor={`input-${todo.id}`}>{todo.title}</label>
            </li>
        }
    }</Project>

}
