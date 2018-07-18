import * as React from 'react'

import { autoRender, createStore } from 'remmi'
import { unfinishedTodoCount$, markAllCompleted, addTodo } from './todoStore'

export class Header extends React.Component {
    // No need to use lenses here, setState is just fine
    // This is just to show off...
    inputText$ = createStore("")

    render() {
        const { store$ } = this.props
        return autoRender(() =>
            <div>
                Tasks left: {unfinishedTodoCount$.value()}
                <br />
                <button onClick={markAllCompleted.bind(null, store$)}>Toggle all</button>
                <br />
                New item: <input value={this.inputText$.value()} onChange={this.handleInputChange} />
                <button onClick={this.handleCreateTodo}>Add</button>
                <br />
                <hr />
            </div>
        )
    }

    handleInputChange = e => {
        this.inputText$.update(d => e.target.value)
    }

    handleCreateTodo = () => {
        addTodo(this.props.store$, this.inputText$.value())
        this.inputText$.update(d => "")
    }
}
