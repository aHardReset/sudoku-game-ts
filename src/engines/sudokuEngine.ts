function generateNewBoard(): number[][] {

  return [
    [-1, 5, -1, 9, -1, -1, -1, -1, -1],
    [8, -1, -1, -1, 4, -1, 3, -1, 7],
    [-1, -1, -1, 2, 8, -1, 1, 9, -1],
    [5, 3, 8, 6, -1, 7, 9, 4, -1],
    [-1, 2, -1, 3, -1, 1, -1, -1, -1],
    [1, -1, 9, 8, -1, 4, 6, 2, 3],
    [9, -1, 7, 4, -1, -1, -1, -1, -1],
    [-1, 4, 5, -1, -1, -1, 2, -1, 9],
    [-1, -1, -1, -1, 3, -1, -1, 7, -1]
  ]
}

function isValid(currentBoard: number[][], num: number, rowIdx: number, colIdx: number): boolean{
  const checkRow = (): boolean => {
    for(let idx = 0; idx < currentBoard[0].length; idx++){
      if (currentBoard[rowIdx][idx] === num && colIdx !== idx ) {
        return false
      }
    }
    return true
  }

  const checkCol = (): boolean => {

    for (let idx = 0; idx < currentBoard.length; idx++) {
      if (currentBoard[idx][colIdx] === num && rowIdx !== idx) {
        return false
      }
    }
    return true
  }

  const checkSquare = (): boolean => {
    const startIdxR: number = rowIdx - (rowIdx % 3)
    const startIdxC: number = colIdx - (colIdx % 3)

    for (let idxR = 0; idxR < 3; idxR++){
      for (let idxC = 0; idxC < 3; idxC++){
        if (currentBoard[startIdxR + idxR][startIdxC + idxC] === num && (startIdxR + idxR) !== rowIdx && (startIdxC + idxC) !== colIdx){
          return false
        }
      }
    }
    return true
  }

  return checkRow() && checkCol() && checkSquare()
}

function solve(initBoard:number[][]) {
  const e = 3
}


export {generateNewBoard, isValid}