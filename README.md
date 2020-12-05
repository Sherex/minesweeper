# [WiP] Minesweeper
A very naively implemented Minesweeper game.

![./assets/minesweeper.gif](./assets/minesweeper.gif)
## How to use
Can be either played or used as a lib.
### Play
```sh
git clone https://github.com/sherex/minesweeper
cd minesweeper
npm install
npm run build
npm start
```
Use the arrowkeys to move around the grid, enter to open the cell and space to flag.

You can also use `node dist/bin/cli-input.ts` to use a prompt based interaction. (for ex. `f2,3` or `o4,3`)

## TODO
- [X] Add auto-open cells with no bombs
- [X] Add win-condition
- [ ] Smarter bomb placement generation
- [ ] Check actual game rules and implement them
  - [X] No bombs around first opened cell
- [ ] And more..

## Goals
- [X] First opened cell should be a good start area
- [ ] No 50/50 cells
- [ ] Auto-solve

## LICENSE
[MIT](LICENSE)