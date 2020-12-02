import { OutOfBoundsError } from './errors'
let chalk: any | undefined
try {
  chalk = require('chalk')
} catch (error) {
  console.log('Chalk is not installed, colors will not be used')
}

export interface PrintGridOptions {
  selectedCell?: Position
  showBombs?: boolean
}

export interface OpenNeighboursOptions {
  pos: Position
}

export interface InteractOptions {
  action: 'open' | 'flag'
  pos: Position
}

export interface InteractResponse {
  success: boolean
  message: 'OUT_OF_BOUNDS' | 'CELL_IS_OPEN' | 'CELL_IS_BOMB' | 'CELL_IS_FLAG' | 'SUCCESS'
}

export interface Position {
  x: number
  y: number
}

export interface BoardOptions {
  size: Position
  bombs: number
  winCallback?: () => void
  loseCallback?: () => void
}

export interface GridCell {
  opened: boolean
  flagged: boolean
  bomb: boolean
  bombNeighbours: GridCell[]
  pos: {
    x: number
    y: number
  }
}

export function isGridCell (cell: any): cell is GridCell {
  if (
    typeof cell !== 'object' ||
    cell === null ||
    typeof cell.opened !== 'boolean' ||
    typeof cell.flagged !== 'boolean' ||
    typeof cell.bomb !== 'boolean' ||
    !Array.isArray(cell.bombNeighbours) ||
    typeof cell.pos !== 'object'
  ) return false
  return true
}

// TODO: Add private to private methods

export class Board {
  readonly size: BoardOptions['size']
  winCallback: () => void
  loseCallback: () => void
  bombs: GridCell[] = []
  grid: GridCell[][]
  constructor (options: BoardOptions) {
    if (options.size.x * options.size.y < options.bombs) {
      throw Error('options.bombs has to be less than size.x * size.y')
    }
    this.winCallback = options.winCallback ?? function () {}
    this.loseCallback = options.loseCallback ?? function () {}
    this.size = options.size
    this.grid = this._createGrid()
    this.plantBombs(options.bombs)
    this.updateBombNeighbours()
  }

  _createGrid (): GridCell[][] {
    const col = []
    for (let y = 0; y < this.size.y; y++) {
      const row = []
      for (let x = 0; x < this.size.x; x++) {
        const cell: GridCell = {
          opened: false,
          flagged: false,
          bomb: false,
          bombNeighbours: [],
          pos: {
            x: x + 1,
            y: y + 1
          }
        }
        row.push(cell)
      }
      col.push(row)
    }
    return col
  }

  loopGrid (callback: (cell: GridCell) => void): void {
    this.grid.forEach(row => {
      row.forEach(col => {
        if (typeof callback === 'function') callback(col)
      })
    })
  }

  getCell ({ x, y }: Position): GridCell | null {
    const row = this.grid[y - 1]
    if (typeof row === 'undefined') return null
    return row[x - 1] ?? null
  }

  plantBombs (numberOfBombs: number): GridCell[] {
    const bombs: number[] = []
    const bombCells: GridCell[] = []
    while (bombs.length < numberOfBombs) {
      const bomb = Math.round(Math.random() * ((this.size.x * this.size.y) - 1)) + 1
      if (bombs.includes(bomb)) continue
      bombs.push(bomb)

      let x = bomb % this.size.x
      x = x !== 0 ? x : this.size.x
      const y = Math.ceil(bomb / this.size.x)
      const cell = this.getCell({ x, y })
      if (cell !== null) {
        cell.bomb = true
        bombCells.push(cell)
      } else {
        throw new OutOfBoundsError({ x, y }, 'Failed to place bomb')
      }
      this.bombs = bombCells
    }
    return bombCells
  }

  getNeighbours ({ x, y }: Position): GridCell[] {
    const neighbours = [
      { x: x - 1, y: y + 1 },
      { x: x, y: y + 1 },
      { x: x + 1, y: y + 1 },
      { x: x + 1, y: y },
      { x: x + 1, y: y - 1 },
      { x: x, y: y - 1 },
      { x: x - 1, y: y - 1 },
      { x: x - 1, y: y }
    ]
    return neighbours
      .map(cell => this.getCell({ x: cell.x, y: cell.y }))
      .filter(isGridCell)
  }

  updateBombNeighbours (): void {
    this.bombs.forEach(bombCell => {
      this.getNeighbours(bombCell.pos).forEach(cell => {
        cell.bombNeighbours.push(bombCell)
      })
    })
  }

  openNeighbours (pos: Position): void {
    console.log('Cell: ', pos)
    this.getNeighbours(pos).forEach(neighbour => {
      if (
        neighbour.opened ||
        neighbour.flagged ||
        neighbour.bomb
      ) return
      neighbour.opened = true
      if (neighbour.bombNeighbours.length < 1) {
        this.openNeighbours(neighbour.pos)
      }
    })
  }

  interact (options: InteractOptions): InteractResponse {
    const cell = this.getCell(options.pos)
    if (cell === null) {
      return {
        success: false,
        message: 'OUT_OF_BOUNDS'
      }
    }
    if (cell.opened) {
      return {
        success: false,
        message: 'CELL_IS_OPEN'
      }
    }
    if (options.action === 'flag') {
      cell.flagged = !cell.flagged
      return {
        success: true,
        message: 'SUCCESS'
      }
    }
    if (options.action === 'open') {
      if (cell.flagged) {
        return {
          success: false,
          message: 'CELL_IS_FLAG'
        }
      }
      cell.opened = true
      if (cell.bomb) {
        this.loseCallback()
        return {
          success: false,
          message: 'CELL_IS_BOMB'
        }
      }
      this.openNeighbours(cell.pos)
      return {
        success: true,
        message: 'SUCCESS'
      }
    }
    return {
      success: true,
      message: 'SUCCESS'
    }
  }

  printGrid (options?: PrintGridOptions): void {
    const rows = this.grid.map(row => {
      const rowStrings = row.map(cell => {
        let cellString = '[#]'
        if (cell.opened && cell.bomb) cellString = '[B]'
        else if (cell.opened) cellString = `[${cell.bombNeighbours.length}]`
        else if (cell.flagged) cellString = '[F]'

        if (options?.showBombs === true && cell.bomb) {
          if (cell.flagged) return chalk.magenta('[B]')
          return chalk.red('[B]')
        }

        if (typeof chalk !== 'undefined') {
          if (
            options?.selectedCell?.x === cell.pos.x &&
            options?.selectedCell?.y === cell.pos.y
          ) cellString = chalk.yellow(cellString)
          else if (cell.opened && cell.bomb) cellString = chalk.red('[B]')
          else if (cell.opened) cellString = chalk.green(`[${cell.bombNeighbours.length}]`)
          else if (cell.flagged) cellString = chalk.cyan('[F]')
          else cellString = chalk.blue(cellString)
        }
        return cellString
      })
      return rowStrings.join('')
    })
    console.log(rows.join('\n'))
  }
}
