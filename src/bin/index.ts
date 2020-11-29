#!/usr/bin/env node
import { Board } from '../'
import readline from 'readline'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

const question = async function (question: string): Promise<string> {
  return await new Promise((resolve) => {
    rl.question(question, resolve)
  })
}

let gameRunning = true
const board = new Board({
  size: {
    x: 10,
    y: 10
  },
  bombs: 20,
  winCallback: () => {
    console.log('WIN!')
    gameRunning = false
  },
  loseCallback: () => {
    console.log('LOST!')
    gameRunning = false
  }
})

board.printGrid()
;(async () => {
  // eslint-disable-next-line no-unmodified-loop-condition
  while (gameRunning) {
    console.log('Action format: f8,3 OR o3,5')
    const answer = await question('Action: ')
    const match = answer.match(/^([ofOF])(\d+),(\d+)$/)
    if (match === null) continue
    const [, action, x, y] = match
    const interactResponse = board.interact({
      action: action === 'o' ? 'open' : 'flag',
      pos: {
        x: Number(x),
        y: Number(y)
      }
    })
    board.printGrid()
    console.log(`Status: ${interactResponse.message}`)
  }
})().catch(console.error).finally(() => { rl.close() })
