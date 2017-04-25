import _ from 'lodash'
import guess from './guess'
import story from './story'

const gameLibrary = {
  guess,
  story
}

export default class GameLibrary {
  constructor () {
    this.games = []
  }

  start (gameId, config) {
    const startGame = gameLibrary[gameId]
    // error msg + abort if game already running in that channel/group chat
    const game = startGame(config)
    games.push(game)
  }

  stop (config) {
    const game = {} // find the game
    game.stop()
  }

  saveAll () {
    const state = _.map(games, (game) => game.serialize())

    // persist somewhere
  }

  loadAll () {
    games = [] // load from disk
  }
}
