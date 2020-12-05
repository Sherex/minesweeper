import { OutOfBoundsError } from './errors'
import chalk from 'chalk'
import {
  BoardOptions,
  GridCell,
  InteractResponse,
  InteractOptions,
  Position,
  PrintGridOptions,
  isGridCell
} from './types'

// TODO: Add private to private methods

export class Board {
  readonly size: BoardOptions['size']
  readonly numberOfBombs: number
  winCallback: () => void
  loseCallback: () => void
  bombCells: GridCell[] = []
  openedCells: GridCell[] = []
  grid: GridCell[][]
  constructor (options: BoardOptions) {
    if (options.size.x * options.size.y < options.numberOfBombs) {
      throw Error('options.numberOfBombs has to be less than size.x * size.y')
    }
    this.winCallback = options.winCallback ?? function () {}
    this.loseCallback = options.loseCallback ?? function () {}
    this.size = options.size
    this.numberOfBombs = options.numberOfBombs
    this.grid = this._createGrid()
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

  filterCells (callback: (cell: GridCell) => boolean): GridCell[] {
    const filteredCells: GridCell[] = []
    this.loopGrid(cell => {
      if (callback(cell)) filteredCells.push(cell)
    })
    return filteredCells
  }

  getCell ({ x, y }: Position): GridCell | null {
    const row = this.grid[y - 1]
    if (typeof row === 'undefined') return null
    return row[x - 1] ?? null
  }

  plantBombs (numberOfBombs: number, excludeCells?: GridCell[]): GridCell[] {
    const posToNumber = (pos: Position): number => (this.size.x * (pos.y - 1)) + pos.x

    const excludePositions: number[] = excludeCells?.map(cell => posToNumber(cell.pos)) ?? []
    const bombPositions: number[] = []
    const bombCells: GridCell[] = []
    while (bombPositions.length < numberOfBombs) {
      const bomb = Math.round(Math.random() * ((this.size.x * this.size.y) - 1)) + 1
      if (bombPositions.includes(bomb)) continue
      if (excludePositions.includes(bomb)) continue
      bombPositions.push(bomb)

      let x = bomb % this.size.x
      x = x !== 0 ? x : this.size.x // If it is the last column (modulo returns 0), return max size.
      const y = Math.ceil(bomb / this.size.x)

      const cell = this.getCell({ x, y })
      if (cell !== null) {
        cell.bomb = true
        bombCells.push(cell)
      } else {
        throw new OutOfBoundsError({ x, y }, 'Failed to place bomb')
      }
      this.bombCells = bombCells
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
    this.bombCells.forEach(bombCell => {
      this.getNeighbours(bombCell.pos).forEach(cell => {
        cell.bombNeighbours.push(bombCell)
      })
    })
  }

  _openNeighbours (pos: Position): void {
    const cell = this.getCell(pos)
    if (cell?.bombNeighbours.length !== 0) return

    this.getNeighbours(pos).forEach(neighbour => {
      if (
        neighbour.opened ||
        neighbour.flagged ||
        neighbour.bomb
      ) return

      this._openCell(neighbour)

      if (neighbour.bombNeighbours.length === 0) {
        this._openNeighbours(neighbour.pos)
      }
    })
  }

  _openCell (cell: GridCell): InteractResponse {
    let response: InteractResponse = {
      success: true,
      message: 'SUCCESS'
    }
    if (cell.opened) {
      response = {
        success: false,
        message: 'CELL_IS_OPEN'
      }
    } else if (cell.flagged) {
      response = {
        success: false,
        message: 'CELL_IS_FLAG'
      }
    } else {
      cell.opened = true
      this.openedCells.push(cell)
    }
    return response
  }

  _flagCell (cell: GridCell): InteractResponse {
    let response: InteractResponse = {
      success: true,
      message: 'SUCCESS'
    }
    if (cell.opened) {
      response = {
        success: false,
        message: 'CELL_IS_OPEN'
      }
    } else {
      cell.flagged = !cell.flagged
    }
    return response
  }

  interact (options: InteractOptions): InteractResponse {
    const cell = this.getCell(options.pos)
    let response: InteractResponse = {
      success: true,
      message: 'SUCCESS'
    }

    if (cell === null) {
      return {
        success: false,
        message: 'OUT_OF_BOUNDS'
      }
    }

    if (options.action === 'flag') {
      response = this._flagCell(cell)
    } else if (options.action === 'open') {
      if (
        this.bombCells.length === 0 &&
        this.openedCells.length === 0
      ) {
        const cellsToExclude = [cell, ...this.getNeighbours(cell.pos)]
        this.plantBombs(this.numberOfBombs, cellsToExclude)
        this.updateBombNeighbours()
      }

      response = this._openCell(cell)
      if (cell.opened && cell.bomb) {
        this.loseCallback()
        response = {
          success: false,
          message: 'CELL_IS_BOMB'
        }
      }
      this._openNeighbours(cell.pos)
    }

    const totalCells = this.size.x * this.size.y
    if (this.openedCells.length >= totalCells - this.bombCells.length) {
      this.winCallback()
    }
    return response
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
          else if (cell.flagged) cellString = chalk.white('[F]')
          else cellString = chalk.blue(cellString)
        }
        return cellString
      })
      return rowStrings.join('')
    })
    console.log(rows.join('\n'))
  }
}
