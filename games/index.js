import _ from 'lodash'
import colors from '../utils/colors'
import story from './story'
import crisis from './crisis'

const gameLibrary = {
  story,
  crisis
}

class GameLibrary {
  constructor () {
    this.games = {}
  }

  start (gameId, config, gameOptions) {
    const game = this.createGame(gameId, config, gameOptions)
    game.start()
  }

  continue (gameId, state, config) {
    const game = this.createGame(gameId, config)
    game.recover(state)
  }

  createGame (gameId, config, gameOptions) {
    // TODO error msg + abort if game already running in that channel/group chat

    const createGame = gameLibrary[gameId]
    const game = createGame(config, {
      onFinish: this.onFinish.bind(this),
      saveState: this.saveState.bind(this)
    }, gameOptions)

    const requiredFunctions = ['start', 'recover', 'abort', 'getGameId', 'serialize']
    const missingFunctions = _.difference(requiredFunctions, _.keys(game))
    if (missingFunctions.length > 0) throw new Error('Missing functions: ' + missingFunctions)

    this.games[config.channel] = game

    return game
  }

  abort (config) {
    const { bot, channel } = config
    this.games[channel].abort()
    this.onFinish(channel)
  }

  abortAll () {
    _.each(this.games, (game, config) => {
      abort(config)
    })
  }

  saveAll () {
    const state = _.reduce(this.games, (result, game, channel) => {
      result[channel] = {
        id: game.getGameId(),
        data: game.serialize()
      }
      return result
    }, {})
    this.controller.storage.teams.save({ id: 'gamebot', gameLibrary: state })
  }

  findRunningGame (channel) {
    return this.games[channel]
  }

  saveState () {
    this.saveAll()
  }

  onFinish (channel) {
    this.games = _.omit(this.games, channel)
    this.saveAll()
  }

  setController (controller) {
    this.controller = controller
  }

  listGames () {
    return _.keys(gameLibrary)
  }
}

const instance = new GameLibrary()
export default instance
