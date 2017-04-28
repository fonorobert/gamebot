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
        return `${p.name}. time ${p.time}, wealth: ${p.wealth}, health: ${p.health}, social: ${p.social}`
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

    }

    stop () {

    }

    recover () {

    }

    abort () {

    }

    getGameId () {

    }

    serialize () {

    }

    processMessage (message) {
      const PLAY_REGEX = /^play\s(\d.*)$/
      const currentPlayer = this.getCurrentPlayer()
      if (message.user === currentPlayer.id) {
        const playMatch = message.text.match(PLAY_REGEX)
        if (playMatch) {
          const cardIndex = +playMatch[1]
          const card = currentPlayer.cards[cardIndex - 1]
          sendMessage(config, `${currentPlayer.name} plays ${card.description}`)
          currentPlayer.playCard(card)
          const others = state.players.filter((p) => p.id !== currentPlayer.id)
          others.forEach((o) => o.applyOtherEffect(card))

          currentPlayer.cards = currentPlayer.cards.filter((c) => c.id !== card.id).concat([this.takeCard()])
        } else if (message.text === 'pass') {

        }
      }
    }

    handlePlayCard () {

    }

    handlePassTurn () {

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
