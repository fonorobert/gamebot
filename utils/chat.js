import _ from 'lodash'
import colors from './colors'

export function sendMessage (config, ...args) {
  if (_.isString(args[0])) {
    sendMessageSimple(config, ...args)
  } else {
    sendMessageAdvanced(config, ...args)
  }
}

export function sendMessageSimple ({ bot, channel }, text, color = colors.success) {
  bot.say({ channel, attachments: [
    {
      fallback: text,
      text: text,
      color,
      "mrkdwn_in": ["text"]
    }
  ]})
}

export function sendMessageAdvanced ({ bot, channel }, message) {
  bot.say(_.assign({}, { channel }, message))
}
