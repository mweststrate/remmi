import * as React from 'react'

import { autoRender, createStore } from 'remmi'

export class Header extends React.Component {
    // No need to use lenses here, setState is just fine
    // This is just to show off...
    inputText$ = createStore("")

    render() {
        const { store$ } = this.props
        return autoRender(() =>
            <div>
                Tasks left: {store$.unfinishedTodoCount$.value()}
                <br />
                <button onClick={store$.markAllCompleted}>Toggle all</button>
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
        this.props.store$.addTodo(this.inputText$.value())
        this.inputText$.update(d => "")
    }
}
