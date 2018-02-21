const {through} = require('mississippi')
const {html} = require('../')
const defined = require('defined')

module.exports = function compose (apps, template) {
  return {
    init () {
      return composeState(apps.map(app => app.init()))
    },
    update (models, action) {
      return composeState(apps.map((app, i) => app.update(models[i], action)))
    },
    view (models, dispatch) {
      return defined(template, defaultTemplate)(
        apps.map((app, i) => app.view(models[i], dispatch))
      )
    },
    run (effects, sources) {
      const s = through.obj()
      let xs = []
      apps.forEach((app, i) => {
        effects.filter(e => (e != null)).map(e => app.run(e, sources)).filter(x => (x != null)).forEach(x => {
          x.pipe(s, {end: false})
          x.once('end', () => {
            x.unpipe(s)
            xs = xs.filter(X => (x !== X))
            if (xs.length === 0) s.end()
          })
          xs.push(x)
        })
      })
      return s
    }
  }
}

function composeState (states) {
  return {
    model: states.map(s => s.model),
    effect: states.some(s => !!s.effect) ? states.map(s => s.effect) : null
  }
}

function defaultTemplate (views) {
  return html`<div>${views}</div>`
}
