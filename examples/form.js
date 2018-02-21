const {html} = require('../')
const xtend = require('xtend')

const ACTIONS = wrap({
  oninput: null,
  onsubmit: null
}, 'todoForm')

module.exports = {
  init () {
    return {
      model: {
        value: '',
        placeholder: 'what is todo'
      }
    }
  },
  update (model, action) {
    if (action.type === ACTIONS.oninput) {
      return {model: xtend(model, {value: action.value})}
    } else if (action.type === ACTIONS.onsubmit) {
      return {
        model: xtend(model, {value: ''}),
        effect: {type: 'todos:addTodo', value: model.value}
      }
    }
    return {model}
  },
  view (model, dispatch) {
    return html`
      <div>
        <form onsubmit=${e => {
          e.preventDefault()
          dispatch({
            type: ACTIONS.onsubmit
          })
        }}>
          <div class="field">
            <label class="label">todo.</label>
            <div class="control">
              <input
                class="input"
                value=${model.value}
                placeholder=${model.placeholder}
                required
                autofocus
                oninput=${e => {
                  e.stopPropagation()
                  dispatch({
                    type: ACTIONS.oninput,
                    value: e.target.value
                  })
                }}
               />
            </div>
          </div>
        </form>
      </div>
    `
  },
  run () {}
}

function wrap (o, ns) {
  return Object.keys(o).reduce((o, name) => {
    o[name] = `${ns}:${name}`
    return o
  }, {})
}
