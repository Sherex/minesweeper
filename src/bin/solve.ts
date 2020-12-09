#!/usr/bin/env node
import { Board, GridCell } from '../'

interface BoardSize {
  x?: number
  y?: number
  bombs?: number
}

let sizes: BoardSize = {}

if (process.argv.length === 5) {
  sizes = {
    x: Number(process.argv[2]),
    y: Number(process.argv[3]),
    bombs: Number(process.argv[4])
  }
} else {
  console.log('Add arguments after command: "X Y Bombs" (ex. 20 20 50)')
  process.exit()
}

const board = new Board({
  size: {
    x: sizes.x ?? 20,
    y: sizes.y ?? 20
  },
  numberOfBombs: sizes.bombs ?? 50,
  winCallback: () => {
    stats.solverStatus = 'WON'
  },
  loseCallback: () => {
    stats.solverStatus = 'LOST'
  }
})

// TODO: Future optiomalization: Only check cells which has closed neighbour cells
console.clear()
board.printGrid()
const initialPos = { x: 1, y: 1 }
const stats = {
  solverStatus: 'RUNNING',
  numberOfOpenedCellsLastRun: 0,
  numberOfEqualRuns: 0,
  maxNumberOfEqualRuns: 3
}
;(async () => {
  board.interact({ action: 'open', pos: initialPos })
  while (stats.solverStatus === 'RUNNING') {
    board.openedCells.forEach(checkCell)
    if (
      board.openedCells.length === stats.numberOfOpenedCellsLastRun &&
      stats.numberOfEqualRuns < stats.maxNumberOfEqualRuns
    ) {
      stats.numberOfEqualRuns++
    }

    if (stats.numberOfEqualRuns >= stats.maxNumberOfEqualRuns) {
      stats.solverStatus = '5050'
    }

    if (board.openedCells.length !== stats.numberOfOpenedCellsLastRun) {
      stats.numberOfOpenedCellsLastRun = board.openedCells.length
      stats.numberOfEqualRuns = 0
    }

    console.clear()
    board.printGrid({
      showBombs: stats.solverStatus !== 'RUNNING'
    })

    if (stats.solverStatus === 'WON') console.log('You won!')
    if (stats.solverStatus === 'LOST') console.log('You lost!')
    if (stats.solverStatus === '5050') console.log('50/50!')
    // await timeout(500)
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
