// Minion waves
const FirstMinionWaveSpawnTime = 65
const MinionWaveSpawnInterval = 30
function GetWaveTime(waveIndex) {
  return FirstMinionWaveSpawnTime + MinionWaveSpawnInterval * waveIndex
}
function GetNextWaveIndex(time) {
  return Math.ceil(Math.max(0, time - FirstMinionWaveSpawnTime) / MinionWaveSpawnInterval)
}
const MeleeMinionGold = 21
const CasterMinionGold = 14
function GetNextCannonMinion(waveIndex) {
  if (index < 27) {
    let stageWaveIndex = Math.floor(waveIndex / 3)
    return {
      waveIndex: 2 + 3 * stageWaveIndex,
      index: stageWaveIndex
    }
  } else if (index < 49) {
    let stageWaveIndex = Math.floor((waveIndex - 27) / 2)
    return {
      waveIndex: 28 + 2 * stageWaveIndex,
      index: 9 + stageWaveIndex
    }
  } else {
    let stageWaveIndex = waveIndex - 49
    return {
      waveIndex: 49 + stageWaveIndex,
      index: 20 + stageWaveIndex
    }
  }
}
function GetCannonMinionGold(index) {
  return 60 + 3 * Math.min(10, index)
}

// Monsters
const MONSTER = Object.freeze({
  Raptors: 1,
  MurkWolves: 2,
  Krugs: 3,
  Gromp: 4,
  BlueSentinel: 5,
  RedBrambleback: 6,
  RiftScuttler: 7
})
const MonsterData = {
  [MONSTER.Raptors]: {
    initialSpawnTime: 90,
    respawnInterval: 150
  },
  [MONSTER.MurkWolves]: {
    initialSpawnTime: 90,
    respawnInterval: 150
  },
  [MONSTER.Krugs]: {
    initialSpawnTime: 102,
    respawnInterval: 150
  },
  [MONSTER.Gromp]: {
    initialSpawnTime: 102,
    respawnInterval: 150
  },
  [MONSTER.BlueSentinel]: {
    initialSpawnTime: 90,
    respawnInterval: 300
  },
  [MONSTER.RedBrambleback]: {
    initialSpawnTime: 90,
    respawnInterval: 300
  },
  [MONSTER.RiftScuttler]: {
    initialSpawnTime: 195,
    respawnInterval: 150
  }
}

// Dragons
const DrakeInitialSpawnTime = 300
const DrakeRespawnInterval = 300
const LastDrakeSpawnTime = 2100
const ElderDragonSpawnInterval = 360
const FirstElderDragonBuffLength = 150
const SubsequentElderDragonBuffLength = 300

// Baron
const RiftHeraldInitialSpawnTime = 600
const BaronNashorInitialSpawnTime = 1200
const BaronNashorSpawnInterval = 360
const BaronNashorBuffLength = 210

// Inhibitor
const InhibitorRespawnTime = 300

// Logic

// const socket = new WebSocket('wss://ec2-54-221-104-42.compute-1.amazonaws.com:8080')
const socket = new WebSocket('wss://ws.kyleoneill.net:8080')

let buttons = null
let gameState = null

socket.addEventListener('message', function (event) {
  let message = JSON.parse(event.data)
  if (message.event === 'initialize' || message.event === 'update') {
    gameState = message.data
    if (buttons != null)
    {
      update()
    }
  }
})

socket.addEventListener('error', function (event) {
  console.log('Error')
  console.log(event)
})

class Button {
  constructor (id, event) {
    this.div = document.getElementById(id)
    this.timer = this.div.getElementsByClassName('timer')[0]

    this.div.addEventListener('click', () => {
      socket.send(JSON.stringify({
        event,
        time: Date.now()
      }))
    })
  }

  setTimer (time) {
    if (time <= 0) {
      this.div.className = 'button'
    } else {
      this.div.className = 'button inactive'
      let minutes = Math.floor(time / 60)
      let seconds = Math.floor(time % 60)
      this.timer.textContent = minutes + ':' + (seconds < 10 ? '0' : '') + seconds
    }
  }
}

function initialize (color) {
  return {
    baron: new Button(`${color}_baron`, 'baronKilled'),
    dragon: new Button(`${color}_dragon`, 'dragonKilled'),
    scuttler: new Button(`${color}_scuttler`, 'scuttleKilled'),
    krug: new Button(`${color}_krug`, 'krugKilled'),
    brambleback: new Button(`${color}_brambleback`, 'redBuffKilled'),
    raptors: new Button(`${color}_raptors`, 'raptorKilled'),
    wolves: new Button(`${color}_wolves`, 'wolfKilled'),
    sentinel: new Button(`${color}_sentinel`, 'blueBuffKilled'),
    gromp: new Button(`${color}_gromp`, 'grompKilled'),
    friendInhibitorTop: new Button(`${color}_inhibitor_top`, 'friendInhibTop'),
    friendInhibitorMid: new Button(`${color}_inhibitor_mid`, 'friendInhibMid'),
    friendInhibitorBot: new Button(`${color}_inhibitor_bot`, 'friendInhibBot')
  }
}

function updateCamp (buttonName, gameStateField, monster) {
  const time = (Date.now() - gameState.startTime) / 1000
  if (gameState[gameStateField] == null) {
    buttons[buttonName].setTimer(MonsterData[monster].initialSpawnTime - time)
  } else {
    buttons[buttonName].setTimer((gameState[gameStateField] - gameState.startTime) / 1000 + MonsterData[monster].respawnInterval - time)
  }
}

function updateInhibitor (buttonName, gameStateField) {
  const time = (Date.now() - gameState.startTime) / 1000

  if (gameState[gameStateField] == null) {
    buttons[buttonName].setTimer(0)
  } else {
    buttons[buttonName].setTimer((gameState[gameStateField] - gameState.startTime) / 1000 + InhibitorRespawnTime - time)
  }
}

function update () {
  if (gameState != null) {
    const time = (Date.now() - gameState.startTime) / 1000

    // Baron
    if (gameState.baronClearTime == null) {
      buttons.baron.setTimer(BaronNashorInitialSpawnTime - time)
    } else {
      buttons.baron.setTimer((gameState.baronClearTime - gameState.startTime) / 1000 + BaronNashorSpawnInterval - time)
    }

    // Camps
    updateCamp('scuttler', 'scuttleClearTime', MONSTER.RiftScuttler)
    updateCamp('krug', 'krugClearTime', MONSTER.Krugs)
    updateCamp('raptors', 'raptorClearTime', MONSTER.Raptors)
    updateCamp('wolves', 'wolfClearTime', MONSTER.MurkWolves)
    updateCamp('gromp', 'grompClearTime', MONSTER.Gromp)
    updateCamp('brambleback', 'redBuffClearTime', MONSTER.RedBrambleback)
    updateCamp('sentinel', 'blueBuffClearTime', MONSTER.BlueSentinel)

    // Dragon
    if (gameState.dragonClearTime == null) {
      buttons.dragon.setTimer(DrakeInitialSpawnTime - time)
    } else {
      buttons.dragon.setTimer((gameState.dragonClearTime - gameState.startTime) / 1000 + DrakeRespawnInterval - time)
    }

    // Inhibitors
    updateInhibitor('friendInhibitorTop', 'friendInhibTopTime')
    updateInhibitor('friendInhibitorMid', 'friendInhibMidTime')
    updateInhibitor('friendInhibitorBot', 'friendInhibBotTime')
  }
}

window.onload = () => {
  document.getElementById('start_game').addEventListener('click', () => {
    socket.send(JSON.stringify({
      event: 'gameStarted',
      time: Date.now()
    }))
  })
  document.getElementById('finish_game').addEventListener('click', () => {
    socket.send(JSON.stringify({
      event: 'gameFinished',
      time: Date.now()
    }))
  })

  buttons = initialize('red')
  if (gameState != null)
  {
    update()
  }
  setInterval(update, 500);
}
