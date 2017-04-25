var _ = require('lodash')

var gameLibrary = {
  story: require('./story')
}

var games = []

module.exports = {
  start: function (gameId, config) {
    var startGame = gameLibrary[gameId]
    var game = startGame(config)
    games.push(game)
  },
  stop: function () {

  },
  saveAll: function () {
    var state = _.map(games, function (game) {
      return game.serialize()
    })

    // persist somewhere
  },
  loadAll: function () {
    games = [] // load from disk
  }
}
