var test = require('tape')
var motoinu = require('../')
var missi = require('mississippi')
var compose = require('../compose')

test('compose(apps[, template]) # initialState # no effect', t => {
  var a = {
    init () { return {model: 1} },
    update () {return null},
    view () {return null},
    run () {return null}
  }
  var b = {
    init () { return {model: -1} },
    update () {return null},
    view () {return null},
    run () {return null}
  }
  var sources = motoinu.start(compose({a, b}))

  sources.states().pipe(missi.through.obj((states, _, done) => {
    t.deepEqual(states, {
      model: {
        a: 1,
        b: -1
      },
      effect: null
    }, JSON.stringify(states))
    done()
  }))

  process.nextTick(() => {
    sources.stop()
    t.end()
  })
})

test('compose(apps[, template]) # initialState # exists effect', t => {
  var a = {
    init () { return {model: 1} },
    update () {return null},
    view () {return null},
    run () {return null}
  }
  var b = {
    init () { return {model: -1, effect: 'FOO'} },
    update () {return null},
    view () {return null},
    run () {return null}
  }
  var sources = motoinu.start(compose({a, b}))

  missi.pipe(
    sources.states(),
    missi.through.obj((states, _, done) => {
    t.deepEqual(states, {
      model: {
        a: 1,
        b: -1
      },
      effect: {
        b: 'FOO'
      }
    }, JSON.stringify(states))
    done()
  }),
  err => {
    err && console.error(err)
    t.end()
  })

  process.nextTick(sources.stop.bind(sources))
})

test('compose(apps[, template]) # update state', t => {
  var a = {
    init () { return {model: 1} },
    update (model, action) {return {model: model + action}},
    view () {return null},
    run () {return null}
  }
  var b = {
    init () { return {model: -1} },
    update (model, action) {return {model: model - action}},
    view () {return null},
    run () {return null}
  }
  var sources = motoinu.start(compose({a, b}))
  var spy = []

  missi.pipe(
    sources.states(),
    missi.through.obj((states, _, done) => {
    spy.push(states)
    done()
  }),
  err => {
    t.error(err, 'no exists error')
    t.is(spy.length, 2, 'get state 2 times')
    t.deepEqual(spy[0], {
      model: {a: 1, b: -1},
      effect: null
    }, JSON.stringify(spy[0]))
    t.deepEqual(spy[1], {
      model: {a: 2, b: -2},
      effect: null
    }, JSON.stringify(spy[1]))
    err && console.error(err)
    t.end()
  })

  process.nextTick(() => {
    sources.actions().write(1)
    sources.stop()
  })
})

test('effect # initialState', t => {
  var a = {
    init () { return {model: null, effect: 1} },
    update (model, action) { return {model} },
    view (model, dispatch) { return null },
    run (effect, s) { return null }
  }
  var b = {
    init () { return {model: null, effect: -1} },
    update (model, action) { return {model} },
    view (model, dispatch) { return null },
    run (effect, s) { return null }
  }
  var sources = motoinu.start(compose({a, b}))
  var spy = []
  missi.pipe(
    sources.effects(),
    missi.through.obj((effect, _, done) => {
      spy.push(effect)
      done()
    }),
    err => {
      t.error(err, 'no exists error')
      t.is(spy.length, 1, 'get effect 1 time')
      t.deepEqual(spy, [{a: 1, b: -1}], JSON.stringify(spy))
      t.end()
    }
  )
  process.nextTick(() => {
    sources.stop()
  })
})

test('effect # update', t => {
  var a = {
    init () { return {model: null, effect: 1} },
    update (model, action) { return {model: model, effect: action} },
    view (model, dispatch) { return null },
    run (effect, s) { return null }
  }
  var b = {
    init () { return {model: null, effect: -1} },
    update (model, action) { return {model: model, effect: -action} },
    view (model, dispatch) { return null },
    run (effect, s) { return null }
  }
  var sources = motoinu.start(compose({a, b}))
  var spy = []
  missi.pipe(
    sources.effects(),
    missi.through.obj((effect, _, done) => {
      spy.push(effect)
      done()
    }),
    err => {
      t.error(err, 'no exists error')
      t.is(spy.length, 2, 'get effect 2 times')
      t.deepEqual(spy, [
        {a: 1, b: -1}, {a: 2, b: -2}
      ], JSON.stringify(spy))
      t.end()
    }
  )
  process.nextTick(() => {
    sources.actions().write(2)
    sources.stop()
  })
})

test('effect # cross over', t => {
  var fa = false
  var a = {
    init () { return {model: 1} },
    update (model, action) {
      if (action === 'CLICK') return {model: model, effect: 'CROSS_OVER_APP'}
      return {model}
    },
    view (model, dispatch) {
      if (!fa) dispatch('CLICK')
      fa = true
    },
    run (effect) { return null }
  }
  var b = {
    init () { return {model: -1} },
    update (model, action) {
      if (action == 'ADD_100') return {model: model + 100}
      return {model}
    },
    view (model, dispatch) { return null },
    run (effect) {
      if (effect !== 'CROSS_OVER_APP') return
      var s = missi.through.obj()
      process.nextTick(() => s.end('ADD_100'))
      return s
    }
  }
  var sources = motoinu.start(compose({a, b}))
  var spy = []
  missi.pipe(
    sources.states(),
    missi.through.obj((state, _, done) => {
      spy.push(state)
      done()
    }),
    err => {
      t.error(err, 'no exists error')
      t.is(spy.length, 3, 'get state 3 times')
      t.deepEqual(spy[0], {
        model: {a: 1, b: -1}, effect: null
      }, JSON.stringify(spy[0]))
      t.deepEqual(spy[1], {
        model: {a: 1, b: -1}, effect: {a: 'CROSS_OVER_APP'}
      }, JSON.stringify(spy[1]))
      t.deepEqual(spy[2], {
        model: {a: 1, b: 99}, effect: null
      }, JSON.stringify(spy[2]))
      t.end()
    }
  )

  setTimeout(() => {
    sources.stop()
  }, 10)
})
