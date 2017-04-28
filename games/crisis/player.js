class Player {
  constructor ({ id, name, cards }) {
    this.id = id
    this.name = name
    this.cards = cards || []
    this.time = 5
    this.wealth = 8
    this.social = 8
    this.health = 8

    this.playCard = this.playCard.bind(this)
    this.applySomeoneEffect = this.applySomeoneEffect.bind(this)
    this.applyOtherEffect = this.applyOtherEffect.bind(this)
  }

  playCard (card) {
    this.time -= card.timeCost
    this.wealth += this.selfWealth
    this.social += this.selfSocial
    this.health += this.selfHealth
  }

  applySomeoneEffect (card) {
    this.time -= card.someoneTime
    this.wealth += card.someoneWealth
    this.health += card.someoneHealth
    this.social += card.someoneSocial
  }

  applyOtherEffect (card) {
    this.time -= card.othersTime
    this.wealth += card.othersWealth
    this.social += card.othersSocial
    this.health += card.othersHealth
  }

  addCard () {

  }
}

export default Player
