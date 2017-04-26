import _ from 'lodash'
import colors from '../utils/colors'
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

  start (gameId, config, gameOptions) {
    const createGame = gameLibrary[gameId]
    // error msg + abort if game already running in that channel/group chat
    const game = createGame(config, {
      onFinish: this.onFinish.bind(this),
      sendMessage: this.sendMessage.bind(this)
    }, gameOptions)

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

  sendMessage (config, ...args) {
    if (_.isString(args[0])) {
      console.log('simple', args)
      this.sendMessageSimple(config, ...args)
    } else {
      console.log('advanced', args)
      this.sendMessageAdvanced(config, ...args)
    }
  }

  sendMessageSimple ({ bot, channel }, text, color = colors.success) {
    bot.say({ channel, attachments: [
      {
        fallback: text,
        text: text,
        color,
        "mrkdwn_in": ["text"]
      }
    ]})
  }

  sendMessageAdvanced ({ bot, channel }, message) {
    bot.say(_.assign({}, { channel }, message))
  }

  onFinish (channel) {
    this.games = _.omit(this.games, channel)
  }
}

const instance = new GameLibrary()
export default instance
