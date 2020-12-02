#!/usr/bin/env node
import { Board, InteractResponse } from '../'

const keys = {
  ARROW_RIGHT: '1b5b43',
  ARROW_LEFT: '1b5b44',
  ARROW_UP: '1b5b41',
  ARROW_DOWN: '1b5b42',
  KEY_ENTER: '0d',
  KEY_SPACE: '20',
  CTRL_C: '03'
}

const board = new Board({
  size: {
    x: 10,
    y: 10
  },
  bombs: 20,
  winCallback: () => {
    console.clear()
    board.printGrid({ showBombs: true })
    console.log('WIN!')
    process.exit()
  },
  loseCallback: () => {
    console.clear()
    board.printGrid({ showBombs: true })
    console.log('LOST!')
    process.exit()
  }
})

const state = {
  pos: {
    x: 1,
    y: 1
  }
}

function getKeys (data: Buffer): void {
  let lastInteraction: InteractResponse | undefined
  switch (data.toString('hex')) {
    case keys.ARROW_RIGHT:
      if (state.pos.x < board.size.x) state.pos.x++
      break

    case keys.ARROW_LEFT:
      if (state.pos.x > 1) state.pos.x--
      break

    case keys.ARROW_UP:
      if (state.pos.y > 1) state.pos.y--
      break

    case keys.ARROW_DOWN:
      if (state.pos.y < board.size.y) state.pos.y++
      break

    case keys.KEY_SPACE:
      lastInteraction = board.interact({
        action: 'flag',
        pos: state.pos
      })
      break

    case keys.KEY_ENTER:
      lastInteraction = board.interact({
        action: 'open',
        pos: state.pos
      })
      break

    case keys.CTRL_C:
      process.exit()

    default:
      console.log(data.toString('hex'))
      break
  }

  console.clear()
  board.printGrid({ selectedCell: state.pos })
  console.log(`Status: ${lastInteraction?.message ?? 'MOVE'}`)
}

;(async () => {
  console.clear()
  board.printGrid({ selectedCell: state.pos })
  process.stdin.setRawMode(true)
  process.stdin.resume()
  process.stdin.on('data', getKeys)
})().catch(console.error)
