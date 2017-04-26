import _ from 'lodash'
import fs from 'fs'
import Player from './player.js'

export default function (config, { sendMessage, onFinish }, { maxIterations = 3 }) {
  const { bot, channel, users, savedState } = config

  const state = savedState || {}

  class ExistentialCrisis {
    constructor () {
      this.cards = null
    }

    start () {
      if (!this.cards) {
        this.load().then((cards) => {
          sendMessage(config, 'EXISTENTIAL CRISIS')
          sendMessage(config, `Loaded ${cards.length} cards`)
          this.cards = _.shuffle(cards)
          this.initPlayers()
        })
      }
    }

    initPlayers () {
      state.players = users.map((userData) => {
        const cards = [this.takeCard(), this.takeCard()]
        return new Player({
          ...userData,
          cards
        })
      })
      state.currentPlayer = Math.floor(Math.random() * state.players.length)

      const printCards = (cards) => {
        return cards.reduce((result, card, index) => {
          return result += `${index + 1}. ${card.description} \n`
        }, '')
      }

      state.players.forEach((player) => {
        sendMessage(config, `${player.name}, your cards are: \n${printCards(player.cards)}`)
      })
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

    processMessage (message) {
      const PLAY_REGEX = /^play\s(\d.*)$/
      const currentPlayer = this.getCurrentPlayer()
      if (message.user === currentPlayer.id) {

        const playMatch = message.text.match(PLAY_REGEX)
        if (playMatch) {
          const cardIndex = +playMatch[1]
          console.log(cardIndex)
        }
      }
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

          const cardFromLine = (line) => {
            const values = line.split(',')
            return fields.reduce((card, field, index) => {
              const type = field.type
              card[field.name] = type(values[index]) || field.default
              return card
            }, {})
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