import React from 'react';
import ReactDOM from 'react-dom';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { createLogger } from 'redux-logger';
import { schema, normalize } from 'normalizr';
import './index.css';

// schemas

const todoSchema = new schema.Entity('todo');

// action types

const TODO_ADD = 'TODO_ADD';
const TODO_TOGGLE = 'TODO_TOGGLE';
const FILTER_SET = 'FILTER_SET';

// reducers

const todos = [
  { id: '0', name: 'learn redux' },
  { id: '1', name: 'learn mobx' },
];

const normalizedTodos = normalize(todos, [todoSchema]);

const initialTodoState = {
  entities: normalizedTodos.entities.todo,
  ids: normalizedTodos.result,
};

function todoReducer(state = initialTodoState, action) {
  switch(action.type) {
    case TODO_ADD : {
      return applyAddTodo(state, action);
    }
    case TODO_TOGGLE : {
      return applyToggleTodo(state, action);
    }
    default : return state;
  }
}

function applyAddTodo(state, action) {
  const todo = { ...action.todo, completed: false };
  const entities = { ...state.entities, [todo.id]: todo };
  const ids = [ ...state.ids, action.todo.id ];
  return { ...state, entities, ids };
}

function applyToggleTodo(state, action) {
  const id = action.todo.id;
  const todo = state.entities[id];
  const toggledTodo = { ...todo, completed: !todo.completed };
  const entities = { ...state.entities, [id]: toggledTodo };
  return { ...state, entities };
}

function filterReducer(state = 'SHOW_ALL', action) {
  switch(action.type) {
    case FILTER_SET : {
      return applySetFilter(state, action);
    }
    default : return state;
  }
}

function applySetFilter(state, action) {
  return action.filter;
}

// action creators

function doAddTodo(id, name) {
  return {
    type: TODO_ADD,
    todo: { id, name },
  };
}

function doToggleTodo(id) {
  return {
    type: TODO_TOGGLE,
    todo: { id },
  };
}

function doSetFilter(filter) {
  return {
    type: FILTER_SET,
    filter,
  };
}

// selectors

function getTodosAsIds(state) {
  return state.todoState.ids;
}

function getTodo(state, todoId) {
  return state.todoState.entities[todoId];
}

// store

const rootReducer = combineReducers({
  todoState: todoReducer,
  filterState: filterReducer,
});

const logger = createLogger();

const store = createStore(
  rootReducer,
  undefined,
  applyMiddleware(logger)
);

// components

function TodoApp() {
  return <ConnectedTodoList />;
}

function TodoList({ todosAsIds }) {
  return (
    <div>
      {todosAsIds.map(todoId => <ConnectedTodoItem
        key={todoId}
        todoId={todoId}
      />)}
    </div>
  );
}

function TodoItem({ todo, onToggleTodo }) {
  const { name, id, completed } = todo;
  return (
    <div>
      {name}
      <button
        type="button"
        onClick={() => onToggleTodo(id)}
      >
        {completed ? "Incomplete" : "Complete"}
    </button>
    </div>
  );
}

// Connecting React and Redux

function mapStateToPropsList(state) {
  return {
    todosAsIds: getTodosAsIds(state),
  };
}

function mapStateToPropsItem(state, props) {
  return {
     todo: getTodo(state, props.todoId),
  };
}

function mapDispatchToPropsItem(dispatch) {
  return {
     onToggleTodo: id => dispatch(doToggleTodo(id)),
  };
}

const ConnectedTodoList = connect(mapStateToPropsList)(TodoList);
const ConnectedTodoItem = connect(mapStateToPropsItem, mapDispatchToPropsItem)(TodoItem);

ReactDOM.render(
  <Provider store={store}>
    <TodoApp />
  </Provider>,
  document.getElementById('root')
);
