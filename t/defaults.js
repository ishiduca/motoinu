var test = require('tape')
var missi = require('mississippi')
var motoinu = require('../')

test('defaultInit', t => {
  t.plan(1)
  var expectedModel = null
  motoinu.start({
    update (model) {
      t.notOk(true, 'should not update state')
    },
    view (model) {
      t.is(model, expectedModel, 'init model is expected')
    },
    run (effect) {
      t.notOk(true, 'should not run effect')
    }
  })
  process.nextTick(() => t.is(expectedModel, null, 'not run'))
})

test('defaultUpdate', t => {
  var expectedModel = {init: true}
  var initialState = {
    model: expectedModel,
    effect: 'INITIALIZE'
  }
  var sources = motoinu.start({
    init () { return initialState },
    run (effect) {
      t.is(effect, initialState.effect, 'effect received')
      return f(['ACTION1', 'ACTION2', 'ACTION3'])
    }
  })

  missi.pipe(
    sources.models(),
    missi.through.obj((model, _, done) => {
      t.is(model, expectedModel, 'initial model is expected')
      done()
    }),
    e => {
      t.end()
    }
  )

  process.nextTick(sources.stop.bind(sources))
  function f (arry) {
    return missi.from((size, next) => {
      var v = arry.shift()
      if (v == null) return next(null, null)
      else next(null, v)
    })
  }
})

test('defaultRun', t => {
  var expectedActions = [
    'ACTION1', 'ACTION2', 'ACTION3'
  ]
  var initialState = {
    model: true,
    effect: 'INITIALIZE'
  }
  var sources = motoinu.start({
    init () { return initialState },
    view (model, disptch) {
      expectedActions.forEach(disptch)
    }
  })
  var spy = []
  missi.pipe(
    sources.actions(),
    missi.through.obj((x, _, done) => {
      spy.push(x)
      done()
    }),
    e => {
      t.error(e, 'no exists error')
      t.deepEqual(spy, expectedActions, 'actions are the same')
      t.end()
    }
  )
  process.nextTick(sources.stop.bind(sources))
})

test('defaultApp', t => {
  var sources = motoinu.start()
  t.ok(sources, 'undefined app has sources')
  t.end()
})
