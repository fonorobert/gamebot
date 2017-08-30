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
  console.log('sendMessageSimple', 'channel:', channel, 'text:', text, 'color:', color)
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
  console.log('sendMessageAdvanced', 'channel:', channel, 'message:', message)
  bot.say(_.assign({}, { channel }, message))
}
