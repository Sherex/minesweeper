export interface PrintGridOptions {
  selectedCell?: Position
  showBombs?: boolean
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
  numberOfBombs: number
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
