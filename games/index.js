import _ from 'lodash'
import guess from './guess'
import story from './story'

const gameLibrary = {
  guess,
  story
}

class GameLibrary {
  constructor () {
    this.games = {}
  }

  start (gameId, config) {
    const createGame = gameLibrary[gameId]
    // error msg + abort if game already running in that channel/group chat
    const game = createGame(config, {
      onFinish: this.onFinish.bind(this),
      sendMessage: this.sendMessage.bind(this)
    })

    this.games[config.channel] = game
    game.start()
  }

  stop (config) {
    const game = {} // find the game
    game.stop()
  }

  saveAll () {
    const state = _.map(games, (game, channel) => ({ [channel]: game.serialize() }))

    // persist somewhere
  }

  loadAll () {
    games = {} // load from disk
  }

  findRunningGame (channel) {
    return this.games[channel]
  }

  sendMessage ({ bot, channel }, text) {
    bot.say({ channel, "attachments": [
      {
        fallback: text,
        text: text,
        color: "#7CD197"
      }
    ]})
  }

  onFinish (channel) {
    this.games = _.omit(this.games, channel)
  }
}

const instance = new GameLibrary()
export default instance