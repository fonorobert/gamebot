import _ from 'lodash'
import fs from 'fs'
import { sendMessage } from '../../utils/chat'
import Player from './player.js'

export default function (config, { saveState, onFinish }, { maxIterations = 3 } = {}) {
  const { bot, channel, users } = config
  let state = {}

  class ExistentialCrisis {
    constructor () {
      this.cards = null

      this.start = this.start.bind(this)
      this.recover = this.recover.bind(this)
      this.abort = this.abort.bind(this)
      this.getGameId = this.getGameId.bind(this)
      this.serialize = this.serialize.bind(this)
      this.init = this.init.bind(this)
    }

    start () {
      if (!this.cards) {
        this.load().then(this.init)
      } else {
        this.init(this.cards)
      }
    }

    init (cards) {
      this.cards = _.shuffle(cards)
      this.initPlayers()
      const playerNames = state.players.reduce((result, player, index, arr) => {
        if (index === 0) return result += player.name
        if (index === arr.length - 1) return result += ` and ${player.name}`
        return result += `, ${player.name}`
      }, '')
      const currentPlayer = state.players[state.currentPlayer]
      sendMessage(config, `${playerNames} are having EXISTENTIAL CRISIS. ${currentPlayer.name} starts\n\n ${this.printPlayerStats()}`)

    }

    getPlayer (id) {
      return _.find(state.players, { id })
    }

    printPlayerStats () {
      const playersStats = state.players.map((p) => {
        return `${p.name}. ${p.time}:clock1: ${p.wealth}:moneybag: ${p.health}:heart: ${p.social}:busts_in_silhouette:`
      }).join('\n')
      return `Players stats are:\n ${playersStats}`
    }

    initPlayers () {
      state.players = users.map((userData) => {
        const cards = [this.takeCard(), this.takeCard()]
        return new Player({
          ...userData,
          cards
        })
      })
      //state.currentPlayer = Math.floor(Math.random() * state.players.length)
      state.currentPlayer = 0
    }

    takeCard () {
      return this.cards.pop()
    }

    getCurrentPlayer () {
      return state.players[state.currentPlayer]
    }

    nextPlayer () {
      const playerCount = state.players.length
      state.currentPlayer = (state.currentPlayer + 1) % playerCount
    }

    stop () { }
    recover () { }
    abort () { }
    getGameId () { }
    serialize () { }

    listToString (list) {
      const printItem = (i) => `${i.value} ${i.name}`

      if (!list.length) return ''
      if (list.length === 1) return printItem(list[0])

      return list.reduce((result, item, index, arr) => {
        if (index === arr.length - 1) return result + ' and ' + printItem(item)
        if (index === 0) return result + printItem(item)
        return result + ', ' + printItem(item)
      }, '')
    }

    printSelfEffects (card) {
      const displayNames = ['time', 'social', 'health', 'money']
      const selfStats = ['timeCost', 'selfSocial', 'selfHealth', 'selfWealth']

      const stats = selfStats.map((stat, index) => {
        return { name: displayNames[index], value: card[stat] }
      })
      const positiveEffects = stats.filter((stat) => stat.value > 0)
      const negativeEffects= stats.filter((stat) => stat.value < 0)

      let result = ''
      if (positiveEffects) {
        result += ` gained ${this.listToString(positiveEffects)}`
      }

      if (negativeEffects) {
        if (result) result += ' and '
        result += `lost ${this.listToString(negativeEffects)}`
      }

      return result
    }

    checkPlayerStatus () {
      const deadPlayers = state.players.filter((p) => p.dead)
      if (deadPlayers.length) {
        state.players = state.players.filter((p) => !p.dead)
        const deadPlayerNames = deadPlayers.map((p) => p.name)
        const alivePlayerNames = state.players.map((p) => p.name)
        if (alivePlayerNames.length === 1) {
          sendMessage(config, `${deadPlayerNames.join(', ')} died. ${alivePlayerNames.join(', ')} won!`)
        } else if (alivePlayerNames.length === 0) {
          sendMessage(config, `${deadPlayerNames.join(', ')} died. Everyone is dead!`)
        } else {
          sendMessage(config, `${deadPlayerNames.join(', ')} died. ${alivePlayerNames.join(', ')} still struggling`)
        }
      }
    }

    processMessage (message) {
      const PLAY_REGEX = /^play\s(\d.*)$/
      const currentPlayer = this.getCurrentPlayer()
      if (message.user === currentPlayer.id) {
        const playMatch = message.text.match(PLAY_REGEX)
        if (playMatch) this.handlePlayCard(+playMatch[1])
        if (message.text === 'pass') this.handlePassTurn()

        this.checkPlayerStatus()
      }
    }

    handlePlayCard (cardIndex) {
      const currentPlayer = this.getCurrentPlayer()
      const card = currentPlayer.cards[cardIndex - 1]

      if (card.timeCost > currentPlayer.time) return sendMessage(config, 'Not enough time to play this card')
      sendMessage(config, `${currentPlayer.name} plays ${card.description} They ${this.printSelfEffects(card)}`)
      currentPlayer.playCard(card)
      const others = state.players.filter((p) => p.id !== currentPlayer.id)
      others.forEach((o) => o.applyOtherEffect(card))

      currentPlayer.cards = currentPlayer.cards.filter((c) => c.id !== card.id).concat([this.takeCard()])
    }

    handlePassTurn () {
      const currentPlayer = this.getCurrentPlayer()
      currentPlayer.resetTurn()
      this.nextPlayer()
      const nextPlayer = this.getCurrentPlayer()
      sendMessage(config, `Next! ${nextPlayer.name}, your move.`)
    }

    load () {
      return new Promise((resolve, reject) => {
        fs.readFile('games/crisis/cards.csv', 'utf8', (err, lines) => {
          if (err) return reject(err)

          const fields = [
            { name: 'description', type: String, default: '' },
            { name: 'isEvent', type: Boolean, default: false },
            { name: 'timeCost', type: Number, default: 0 },
            { name: 'selfSocial', type: Number, default: 0 },
            { name: 'selfHealth', type: Number, default: 0 },
            { name: 'selfWealth', type: Number, default: 0 },
            { name: 'someoneSocial', type: Number, default: 0 },
            { name: 'someoneHealth', type: Number, default: 0 },
            { name: 'someoneWealth', type: Number, default: 0 },
            { name: 'someoneTime', type: Number, default: 0 },
            { name: 'othersSocial', type: Number, default: 0 },
            { name: 'othersHealth', type: Number, default: 0 },
            { name: 'othersWealth', type: Number, default: 0 },
            { name: 'othersTime', type: Number, default: 0 }
          ]

          const cardFromLine = (line, cardIndex) => {
            const values = line.split(',')
            return fields.reduce((card, field, index) => {
              const type = field.type
              card[field.name] = type(values[index]) || field.default
              return card
            }, { id: cardIndex })
          }
          const cards = lines
            .split('\n')
            .splice(2)
            .map(cardFromLine)
          resolve(cards)
        })
      })
    }
  }

  return new ExistentialCrisis()
}
