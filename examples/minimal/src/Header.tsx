import * as React from 'react'

import { project } from './remmi'
import { unfinishedTodoCount$, markAllCompleted, addTodo } from './todoStore'

export class Header extends React.Component {
    state = { inputText: '' }

    render() {
        const { store$ } = this.props
        return project(unfinishedTodoCount$, ([unfinishedTodoCount]) => (
            <div>
                Tasks left: {unfinishedTodoCount}
                <br />
                <button onClick={markAllCompleted.bind(null, store$)}>Toggle all</button>
                <br />
                New item: <input value={this.state.inputText} onChange={this.handleInputChange} />
                <button onClick={this.handleCreateTodo}>Add</button>
                <br />
                <hr />
            </div>
        ))
    }

    handleInputChange = e => {
        this.setState({ inputText: e.target.value })
    }

    handleCreateTodo = () => {
        addTodo(this.props.store$, this.state.inputText)
        this.setState({ inputText: '' })
    }
}
