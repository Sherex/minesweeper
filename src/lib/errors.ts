interface Position {
  x: number
  y: number
}

export class OutOfBoundsError extends Error {
  readonly position: Position
  constructor (position: Position, message?: string | undefined) {
    super(message)
    this.position = position
  }
}
