class Player {
  constructor ({ id, name, cards }) {
    this.id = id
    this.name = name
    this.cards = cards || []
    this.time = 5
    this.wealth = 8
    this.social = 8
    this.health = 8
    this.dead = false
    this.playedCard = false

    this.playCard = this.playCard.bind(this)
    this.applySomeoneEffect = this.applySomeoneEffect.bind(this)
    this.applyOtherEffect = this.applyOtherEffect.bind(this)
    this.addToStat = this.addToStat.bind(this)
    this.removeTime = this.removeTime.bind(this)
    this.resetTurn = this.resetTurn.bind(this)
  }

  addToStat (statName, value, max = 10) {
    const result = Math.max(Math.min(this[statName] + value, max), 0)
    this[statName] = result
    if (result <= 0) this.dead = true
  }

  resetTurn () {
    this.time = 5
    this.playedCard = false
  }

  removeTime (time) {
    this.time = Math.max(this.time + time, 0)
  }

  playCard (card) {
    this.removeTime(card.timeCost)
    this.addToStat('wealth', card.selfWealth)
    this.addToStat('social', card.selfSocial)
    this.addToStat('health', card.selfHealth)
    this.playedCard = true
  }

  applySomeoneEffect (card) {
    this.removeTime(-card.someoneTime)
    this.addToStat('wealth', card.someoneWealth)
    this.addToStat('social', card.someoneSocial)
    this.addToStat('health', card.someoneHealth)
  }

  applyOtherEffect (card) {
    this.removeTime(card.othersTime)
    this.addToStat('wealth', card.othersWealth)
    this.addToStat('social', card.othersSocial)
    this.addToStat('health', card.othersHealth)
  }
}

export default Player
