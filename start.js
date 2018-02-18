var defined = require('defined')
var missi = require('mississippi')
var xtend = require('xtend')
var defaults = require('./defaults')

module.exports = start

function start (app) {
  app = xtend(app)
  var init = defined(app.init, defaults.init)
  var update = defined(app.update, defaults.update)
  var view = defined(app.view, defaults.view)
  var run = defined(app.run, defaults.run)
  var errors = missi.through.obj()
  var actions = missi.through.obj()
  var states = missi.through.obj()
  var models = missi.through.obj()
  var views = missi.through.obj()
  var effects = missi.through.obj()
  var effectActionsSources = missi.through.obj()
  var initialState = init.call(app)

  missi.pipe(
    actions,
    scan(function (state, action) {
      return update.call(app, state.model, action)
    }, initialState),
    states,
    map(function (state) { return state.model }),
    difference(),
    models,
    map(function (model) { return view.call(app, model, dispatch) }),
    views,
    onEnd
  )

  var notifys = {
    actions: actions,
    states: states,
    models: models,
    views: views,
    effects: effects,
    effectActionsSources: effectActionsSources
  }

  var sources = Object.keys(notifys).reduce(function (x, name) {
    x[name] = (
      ['states', 'models', 'effects', 'views'].indexOf(name) !== -1
    ) ? replayLastValue(notifys[name]) : function () {
      return notifys[name]
    }
    return x
  }, {})

  missi.pipe(
    states,
    map(function (state) { return state.effect }),
    effects,
    map(function (effect) { return run.call(app, effect, sources) }),
    effectActionsSources,
    missi.through.obj(function (s, _, done) {
      var me = this
      s.pipe(missi.through.obj(function (action, _, done) {
        me.push(action)
        done()
      }))
      done()
    }),
    actions,
    onEnd
  )

  process.nextTick(function () { states.write(initialState) })

  return xtend(sources, {errors: errors, stop: stop})

  function dispatch (nextAction) { actions.write(nextAction) }
  function onEnd (err) { err && errors.write(err) }
  function stop () {
    Object.keys(notifys).forEach(function (name) {
      notifys[name].end()
    })
  }
}

function replayLastValue (s) {
  var last
  s.pipe(missi.through.obj(function (x, _, done) {
    last = x
    done()
  }))

  return function () {
    return missi.through.obj(function (x, _, done) {
      done(null, last)
    }).pipe(s)
  }
}

function difference () {
  var last
  return filter(function (x) {
    var flg = x !== last
    last = x
    return flg
  })
}

function filter (f) {
  return missi.through.obj(function (x, _, done) {
    var flg = !!f(x)
    if (flg) done(null, x)
    else done()
  })
}

function map (f) {
  return missi.through.obj(function (x, _, done) {
    done(null, f(x))
  })
}

function scan (f, x) {
  var a = xtend(x)
  return missi.through.obj(function (x, _, done) {
    a = f(a, x)
    done(null, a)
  })
}
