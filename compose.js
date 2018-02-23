var yo = require('yo-yo')
var missi = require('mississippi')
var defined = require('defined')

module.exports = function compose (apps, template) {
  return {
    init () {
      return composeState(
        Object.keys(apps).reduce(function (x, name) {
          x[name] = apps[name].init()
          return x
        }, {})
      )
    },
    update (models, action) {
      return composeState(
        Object.keys(apps).reduce(function (x, name) {
          x[name] = apps[name].update(models[name], action)
          return x
        }, {})
      )
    },
    view (models, dispatch) {
      return defined(template, defaultTemplate)(
        Object.keys(apps).reduce(function (x, name) {
          x[name] = apps[name].view(models[name], dispatch)
          return x
        }, {})
      )
    },
    run (effects, sources) {
      var ts = missi.through.obj()
      var xs = []
      Object.keys(apps).forEach(function (name) {
        Object.keys(effects).map(function (effectName) {
          return apps[name].run(effects[effectName], sources)
        })
        .filter(function (stream) { return stream != null })
        .forEach(function (stream) {
          stream.pipe(ts, {end: false})
          stream.once('end', function () {
            stream.unpipe(ts)
            xs = xs.filter(function (x) { return x !== stream })
            if (xs.length === 0) ts.end()
          })
          xs.push(stream)
        })
      })
      return ts
    }
  }
}

function composeState (states) {
  var names = Object.keys(states)
  return {
    model: names.reduce(function (x, name) {
      var state = states[name]
      var model = state.model
      x[name] = model
      return x
    }, {}),
    effect: (
      names.some(function (name) { return (states[name].effect != null) })
        ? names.reduce(function (x, name) {
          var state = states[name]
          var effect = state.effect
          if (effect != null) x[name] = effect
          return x
        }, {})
        : null
    )
  }
}

function defaultTemplate (views) {
  return yo`<div>
    ${Object.keys(views).map(function (name) { return views[name] })}
  </div>`
}
