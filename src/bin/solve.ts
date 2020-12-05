#!/usr/bin/env node
import { Board, GridCell } from '../'

let solverRunning = true
const board = new Board({
  size: {
    x: 20,
    y: 20
  },
  numberOfBombs: 50,
  winCallback: () => {
    solverRunning = false
  },
  loseCallback: () => {
    solverRunning = false
  }
})

// TODO: Future optiomalization: Only check cells which has closed neighbour cells
console.clear()
board.printGrid()
const initialPos = { x: 1, y: 1 }
let numberOfOpenedCellsLastRun = 0
;(async () => {
  board.interact({ action: 'open', pos: initialPos })
  while (solverRunning) {
    board.openedCells.forEach(checkCell)
    console.clear()
    board.printGrid()
    if (board.openedCells.length === numberOfOpenedCellsLastRun) {
      solverRunning = false
      console.log('STATUS: 50/50 cells detected')
    } else {
      numberOfOpenedCellsLastRun = board.openedCells.length
    }
    await timeout(500)
  }
})().catch(console.error)

function checkCell (cell: GridCell): void {
  if (cell.bombNeighbours.length < 1) return
  const cellStat: {
    closed: GridCell[]
    toFlag: number
  } = {
    closed: [],
    toFlag: cell.bombNeighbours.length
  }
  board.getNeighbours(cell.pos).forEach(nCell => {
    if (nCell.flagged) {
      cellStat.toFlag--
    } else if (!nCell.opened) {
      cellStat.closed.push(nCell)
    }
  })

  if (cellStat.closed.length === cellStat.toFlag) {
    cellStat.closed.forEach(({ pos }) => {
      board.interact({ action: 'flag', pos })
    })
  } else if (cellStat.closed.length > 0 && cellStat.toFlag === 0) {
    cellStat.closed.forEach(({ pos }) => {
      board.interact({ action: 'open', pos })
    })
  }
}

async function timeout (ms: number): Promise<void> {
  return await new Promise((resolve) => { setTimeout(resolve, ms) })
}
