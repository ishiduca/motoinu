const {html} = require('../')
const {through} = require('mississippi')
const xtend = require('xtend')

const ACTIONS = wrap({
  concatTodo: null,
  deleteTodo: null,
  toggleTodo: null
}, 'todos')

module.exports = {
  init () {
    return {
      model: {
        todos: [
          {
            id: String(Date.now()),
            text: 'test',
            done: false
          }
        ]
      }
    }
  },
  update (model, action) {
    if (action.type === ACTIONS.concatTodo) {
      model.todos = [{
        id: String(Date.now()),
        text: action.value,
        done: false
      }].concat(model.todos)
      return {model}
    } else if (action.type === ACTIONS.toggleTodo) {
      model.todos = model.todos.map(todo => (
        todo.id === action.value.id ? xtend(todo, {done: !todo.done}) : todo
      ))
      return {model}
    } else if (action.type === ACTIONS.deleteTodo) {
      model.todos = model.todos.filter(todo => (todo.id !== action.value.id))
      return {model}
    }
    return {model}
  },
  view (model, dispatch) {
    return html`
      <div>
        <ul>
          ${model.todos.map(todo => html`
            <li>
              ${todo.done
                ? html`<input
                    type="checkbox"
                    value=${todo.id}
                    checked
                    onchange=${e => onchange(todo)}
                  />`
                : html`<input
                    type="checkbox"
                    value=${todo.id}
                    onchange=${e => onchange(todo)}
                  />
                  `
              }
              <span>${todo.text}</span>
              <button onclick=${e => dispatch({
                type: ACTIONS.deleteTodo,
                value: todo
              })}>delete</button>
            </li>
          `)}
        </ul>
      </div>
    `
    function onchange (todo) {
      dispatch({
        type: ACTIONS.toggleTodo,
        value: todo
      })
    }
  },
  run (effect, sources) {
    if (effect.type === 'todos:addTodo') {
      let s = through.obj()
      process.nextTick(() => s.end({
        type: ACTIONS.concatTodo,
        value: effect.value
      }))
      return s
    }
  }
}

function wrap (o, ns) {
  return Object.keys(o).reduce((o, n) => {
    o[n] = `${ns}:${n}`
    return o
  }, {})
}
