const {html} = require('../')
const missi = require('mississippi')

module.exports = {
  init () {
    return {
      model: 0,
      effect: 'SCHEDULE_TICK'
    }
  },
  update (model, action) {
    if (action === 'TICK') {
      return {
        model: model === 59 ? 0 : model + 1,
        effect: 'SCHEDULE_TICK'
      }
    }
    return {model}
  },
  view (model) {
    return html`
      <div id="main">${model}</div>
    `
  },
  run (effect) {
    if (effect === 'SCHEDULE_TICK') {
      let s = missi.through.obj()
      setTimeout(() => s.end('TICK'), 1000)
      return s
    }
  }
}
