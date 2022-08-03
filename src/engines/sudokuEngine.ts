const emptyCellIdentifier = -1;

function copyObject(object: Object) {
  return JSON.parse(JSON.stringify(object));
}

function getDummyBoard(): number[][] {
  return [
    [-1, 5, -1, 9, -1, -1, -1, -1, -1],
    [8, -1, -1, -1, 4, -1, 3, -1, 7],
    [-1, -1, -1, 2, 8, -1, 1, 9, -1],
    [5, 3, 8, 6, -1, 7, 9, 4, -1],
    [-1, 2, -1, 3, -1, 1, -1, -1, -1],
    [1, -1, 9, 8, -1, 4, 6, 2, 3],
    [9, -1, 7, 4, -1, -1, -1, -1, -1],
    [-1, 4, 5, -1, -1, -1, 2, -1, 9],
    [-1, -1, -1, -1, 3, -1, -1, 7, -1],
  ];
}

function shuffle(array: Array<number>) {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

function generateNewBoard(): number[][] {
  const base = 3;
  const side = base * base;
  const gameSpace = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const emptiesByDifficulty = [26, 30, 35, 41];
  const difficulty = 0;

  const pattern = (row: number, col: number) =>
    (base * (row % base) + Math.floor(row / base) + col) % side;
  let rBase = [];
  for (let rBaseIdx = 0; rBaseIdx < base; rBaseIdx++) {
    rBase.push(rBaseIdx);
  }

  let rBaseShuffle = shuffle(copyObject(rBase));
  let rows = [];
  for (let r = 0; r < rBaseShuffle.length; r++) {
    let innerBaseShuffle = shuffle(copyObject(rBase));
    for (let g = 0; g < innerBaseShuffle.length; g++) {
      rows.push(g * base + r);
    }
  }

  rBaseShuffle = shuffle(copyObject(rBase));
  let cols = [];
  for (let c = 0; c < rBaseShuffle.length; c++) {
    let innerBaseShuffle = shuffle(copyObject(rBase));
    for (let g = 0; g < innerBaseShuffle.length; g++) {
      cols.push(g * base + c);
    }
  }

  let randomizeSpace = shuffle(gameSpace);
  let board = [];
  for (let r = 0; r < rows.length; r++) {
    let _row = [];
    for (let c = 0; c < cols.length; c++) {
      _row.push(randomizeSpace[pattern(r, c)]);
    }
    board.push(_row);
  }

  const squares = side * side;
  let randomCells = [];
  const empties = emptiesByDifficulty[difficulty];
  for (let s = 0; s < squares; s++) {
    randomCells.push(s);
  }

  randomCells = shuffle(randomCells);
  randomCells = randomCells.slice(0, empties);

  for (let emptiesIdx = 0; emptiesIdx < randomCells.length; emptiesIdx++) {
    board[Math.floor(randomCells[emptiesIdx] / side)][
      randomCells[emptiesIdx] % side
    ] = emptyCellIdentifier;
  }
  if (isAValidGame(board)) {
    return board;
  }
  return generateNewBoard();
}

function isAValidGame(currentBoard: number[][]): boolean {
  // is a valid game === true when all the values in the current board are valid under sudoku rules
  for (let row = 0; row < currentBoard.length; row++) {
    for (let col = 0; col < currentBoard[0].length; col++) {
      if (
        currentBoard[row][col] !== -1 &&
        !isValid(currentBoard, currentBoard[row][col], row, col)
      ) {
        return false;
      }
    }
  }
  return true;
}

function isValid(
  currentBoard: number[][],
  num: number,
  rowIdx: number,
  colIdx: number
): boolean {
  const checkRow = (): boolean => {
    for (let idx = 0; idx < currentBoard[0].length; idx++) {
      if (currentBoard[rowIdx][idx] === num && colIdx !== idx) {
        return false;
      }
    }
    return true;
  };

  const checkCol = (): boolean => {
    for (let idx = 0; idx < currentBoard.length; idx++) {
      if (currentBoard[idx][colIdx] === num && rowIdx !== idx) {
        return false;
      }
    }
    return true;
  };

  const checkSquare = (): boolean => {
    const startIdxR: number = rowIdx - (rowIdx % 3);
    const startIdxC: number = colIdx - (colIdx % 3);

    for (let idxR = 0; idxR < 3; idxR++) {
      for (let idxC = 0; idxC < 3; idxC++) {
        if (
          currentBoard[startIdxR + idxR][startIdxC + idxC] === num &&
          startIdxR + idxR !== rowIdx &&
          startIdxC + idxC !== colIdx
        ) {
          return false;
        }
      }
    }
    return true;
  };

  return checkRow() && checkCol() && checkSquare();
}

function findNextEmpty(currentBoard: number[][]): number[] {
  let nextEmpty: Array<number> = [];
  for (let row = 0; row < currentBoard.length; row++) {
    for (let col = 0; col < currentBoard[0].length; col++) {
      if (currentBoard[row][col] === emptyCellIdentifier) {
        return [row, col];
      }
    }
  }
  return [-1, -1];
}

type Step = {
  row: number;
  col: number;
  val: number;
};

function solveHelper(currentBoard: number[][], stepsRecorder?: Step[]) {
  let nextEmpty = findNextEmpty(currentBoard);
  if (nextEmpty[0] === -1 && nextEmpty[1] === -1) {
    return true;
  }

  const row = nextEmpty[0];
  const col = nextEmpty[1];

  for (let guess = 1; guess <= 9; guess++) {
    if (stepsRecorder !== undefined) {
      let step: Step = { row: row, col: col, val: guess };
      stepsRecorder.push(step);
    }
    if (isValid(currentBoard, guess, row, col)) {
      currentBoard[row][col] = guess;
      if (solveHelper(currentBoard, stepsRecorder) === true) {
        return true;
      }
      currentBoard[row][col] = emptyCellIdentifier;
    }
  }
  if (stepsRecorder !== undefined) {
    let step: Step = { row: row, col: col, val: emptyCellIdentifier };
    stepsRecorder.push(step);
  }
  return false;
}

function isASolvedBoard(board: number[][]): boolean {
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[0].length; col++) {
      if (
        board[row][col] === -1 ||
        !isValid(board, board[row][col], row, col)
      ) {
        return false;
      }
    }
  }

  return true;
}

function solve(initBoard: number[][], stepsRecorder?: Step[]) {
  let solvedBoard = JSON.parse(JSON.stringify(initBoard));
  solveHelper(solvedBoard, stepsRecorder);
  return solvedBoard;
}

export {
  generateNewBoard,
  isValid,
  emptyCellIdentifier,
  solve,
  isASolvedBoard,
  findNextEmpty,
};
export type { Step };
