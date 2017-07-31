import React from 'react';
import ReactDOM from 'react-dom';
import { applyMiddleware, combineReducers, createStore } from 'redux';
import { Provider, connect } from 'react-redux';
import { createLogger } from 'redux-logger';
import createSagaMiddleware, { delay } from 'redux-saga';
import { put, takeEvery } from 'redux-saga/effects';
import { schema, normalize } from 'normalizr';
import uuid from 'uuid/v4';
import './index.css';

// filters

const VISIBILITY_FILTERS = {
  SHOW_COMPLETED: item => item.completed,
  SHOW_INCOMPLETED: item => !item.completed,
  SHOW_ALL: item => true,
};

// schemas

const todoSchema = new schema.Entity('todo');

// action types

const TODO_ADD = 'TODO_ADD';
const TODO_TOGGLE = 'TODO_TOGGLE';
const FILTER_SET = 'FILTER_SET';
const NOTIFICATION_HIDE = 'NOTIFICATION_HIDE';
const TODO_ADD_WITH_NOTIFICATION = 'TODO_ADD_WITH_NOTIFICATION';

// reducers

const todos = [
  { id: '1', name: 'Hands On: Redux Standalone with advanced Actions' },
  { id: '2', name: 'Hands On: Redux Standalone with advanced Reducers' },
  { id: '3', name: 'Hands On: Bootstrap App with Redux' },
  { id: '4', name: 'Hands On: Naive Todo with React and Redux' },
  { id: '5', name: 'Hands On: Sophisticated Todo with React and Redux' },
  { id: '6', name: 'Hands On: Connecting State Everywhere' },
  { id: '7', name: 'Hands On: Todo with advanced Redux' },
  { id: '8', name: 'Hands On: Todo but more Features' },
  { id: '9', name: 'Hands On: Todo with Notifications' },
  { id: '10', name: 'Hands On: Hacker News with Redux' },
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

function notificationReducer(state = {}, action) {
  switch(action.type) {
    case TODO_ADD : {
      return applySetNotifyAboutAddTodo(state, action);
    }
    case NOTIFICATION_HIDE : {
      return applyRemoveNotification(state, action);
    }
    default : return state;
  }
}

function applySetNotifyAboutAddTodo(state, action) {
  const { name, id } = action.todo;
  return { ...state, [id]: 'Todo Created: ' + name  };
}

function applyRemoveNotification(state, action) {
  const {
    [action.id]: notificationToRemove,
    ...restNotifications,
  } = state;
  return restNotifications;
}

// action creators

function doAddTodoWithNotification(id, name) {
  return {
    type: TODO_ADD_WITH_NOTIFICATION,
    todo: { id, name },
  };
}

function doHideNotification(id) {
  return {
    type: NOTIFICATION_HIDE,
    id
  };
}

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
  return state.todoState.ids
    .map(id => state.todoState.entities[id])
    .filter(VISIBILITY_FILTERS[state.filterState])
    .map(todo => todo.id);
}

function getTodo(state, todoId) {
  return state.todoState.entities[todoId];
}

function getNotifications(state) {
  return getArrayOfObject(state.notificationState);
}

function getArrayOfObject(object) {
  return Object.keys(object).map(key => object[key]);
}

// sagas

function* watchAddTodoWithNotification() {
  yield takeEvery(TODO_ADD_WITH_NOTIFICATION, handleAddTodoWithNotification);
}

function* handleAddTodoWithNotification(action) {
  const { todo } = action;
  const { id, name } = todo;
  yield put(doAddTodo(id, name));
  yield delay(5000);
  yield put(doHideNotification(id));
}

// store

const rootReducer = combineReducers({
  todoState: todoReducer,
  filterState: filterReducer,
  notificationState: notificationReducer,
});

const logger = createLogger();
const saga = createSagaMiddleware();

const store = createStore(
  rootReducer,
  undefined,
  applyMiddleware(saga, logger)
);

saga.run(watchAddTodoWithNotification);

// components

function TodoApp() {
  return (
    <div>
      <ConnectedFilter />
      <ConnectedTodoCreate />
      <ConnectedTodoList />
      <ConnectedNotifications />
    </div>
  );
}

function Notifications({ notifications }) {
  return (
    <div>
      {notifications.map(note => <div key={note}>{note}</div>)}
    </div>
  );
}

function Filter({ onSetFilter }) {
  return (
    <div>
      Show
      <button
        type="text"
        onClick={() => onSetFilter('SHOW_ALL')}>
        All</button>
      <button
        type="text"
        onClick={() => onSetFilter('SHOW_COMPLETED')}>
        Completed</button>
      <button
        type="text"
        onClick={() => onSetFilter('SHOW_INCOMPLETED')}>
        Incompleted</button>
    </div>
  );
}

class TodoCreate extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      value: '',
    };

    this.onCreateTodo = this.onCreateTodo.bind(this);
    this.onChangeName = this.onChangeName.bind(this);
  }

  onChangeName(event) {
    this.setState({ value: event.target.value });
  }

  onCreateTodo(event) {
    this.props.onAddTodo(this.state.value);
    this.setState({ value: '' });
    event.preventDefault();
  }

  render() {
    return (
      <div>
        <form onSubmit={this.onCreateTodo}>
          <input
            type="text"
            placeholder="Add Todo..."
            value={this.state.value}
            onChange={this.onChangeName}
          />
          <button type="submit">Add</button>
        </form>
      </div>
    );
  }
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

function mapDispatchToPropsCreate(dispatch) {
  return {
    onAddTodo: name => dispatch(doAddTodoWithNotification(uuid(), name)),
  };
}

function mapDispatchToPropsFilter(dispatch) {
  return {
    onSetFilter: filterType => dispatch(doSetFilter(filterType)),
  };
}

function mapStateToPropsNotifications(state, props) {
  return {
     notifications: getNotifications(state),
  };
}

const ConnectedTodoList = connect(mapStateToPropsList)(TodoList);
const ConnectedTodoItem = connect(mapStateToPropsItem, mapDispatchToPropsItem)(TodoItem);
const ConnectedTodoCreate = connect(null, mapDispatchToPropsCreate)(TodoCreate);
const ConnectedFilter = connect(null, mapDispatchToPropsFilter)(Filter);
const ConnectedNotifications = connect(mapStateToPropsNotifications)(Notifications);

ReactDOM.render(
  <Provider store={store}>
    <TodoApp />
  </Provider>,
  document.getElementById('root')
);
