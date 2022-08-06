import './styles/sudoku.css'
import React, { useState, useRef, useEffect, ReactElement } from 'react'
import {
  generateNewBoard,
  isValid,
  emptyCellIdentifier,
  solve,
  isASolvedBoard,
  isABlockedCell,
  getDummyBoard
} from './engines/sudokuEngine'

import type { Step } from './engines/sudokuEngine'

const minAnimationSpeed = 1000
const maxAnimationSpeed = 50

type SolveResults ={
  wasSolvedAutomatically: boolean,
  seconds: number,
  difficulty: number,
  endBoard: number[][],
  initBoard: number[][],
}

type StateMachine = {
  current: string,
  previous?: string,
}

function Sudoku () {
  const [currentBoard, setCurrentBoard] = useState(getObjectCopy(generateNewBoard()))
  const [solveAutomaticallyRequest, setSolveAutomaticallyRequest] = useState(false)
  const [stateMachine, setStateMachine] = useState<StateMachine>({ current: 'loading' })
  const animationSpeed = useRef(maxAnimationSpeed + Math.round((minAnimationSpeed - maxAnimationSpeed) / 2))
  const [solveResults, setSolveResults] = useState<SolveResults>({ wasSolvedAutomatically: false, seconds: 0, endBoard: [[]], initBoard: getObjectCopy(currentBoard), difficulty: 0 })

  useEffect(() => {
    setStateMachine({ current: 'configuration', previous: 'loading' })
  }, [])

  function getObjectCopy (arr: object) {
    return JSON.parse(JSON.stringify(arr))
  }

  function cellInputChange (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) {
    const val = parseInt(e.target.value) || emptyCellIdentifier
    const grid = getObjectCopy(currentBoard)

    const isValidValue = (val: number) => {
      return val === -1 || (val >= 1 && val <= 9)
    }

    if (isValidValue(val)) {
      grid[row][col] = val
      setCurrentBoard(grid)
    }
  }

  function getClassCell (row: number, col: number): string {
    let classes = 'cell-input'
    if (isABlockedCell(solveResults.initBoard, row, col)) {
      classes += ' cell-blocked'
    } else if (
      currentBoard[row][col] !== emptyCellIdentifier &&
      !isValid(getObjectCopy(currentBoard), currentBoard[row][col], row, col)
    ) {
      classes += ' cell-not-valid'
    } else if (isASolvedBoard(currentBoard)) {
      classes += ' cell-blocked-by-solved-board'
    } else if (solveAutomaticallyRequest) {
      classes += ' cell-blocked-by-backtracking'
    }

    return classes
  }

  function resetBoard () {
    setCurrentBoard(getObjectCopy(solveResults.initBoard))
  }

  function sleep (ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms))
  }

  function * sudokuBacktracingSteps (steps: Step[]) {
    let currentStep = steps.shift()
    const stepsBoard = getObjectCopy(solveResults.initBoard)
    while (currentStep !== undefined) {
      const row: number = currentStep.row
      const col: number = currentStep.col
      const val: number = currentStep.val
      stepsBoard[row][col] = val
      setCurrentBoard(getObjectCopy(stepsBoard))
      yield
      currentStep = steps.shift()
    }
  }

  async function sudokuBacktracingAnimation (solvedBoardSteps: Step[]) {
    const solveGenerator = sudokuBacktracingSteps(solvedBoardSteps)
    while (true) {
      const nextStep = solveGenerator.next()
      if (nextStep.done) {
        break
      }
      await sleep(animationSpeed.current)
    }
    setSolveAutomaticallyRequest(false)
  }

  async function solveBoard () {
    if (solveAutomaticallyRequest === false) {
      setSolveAutomaticallyRequest(true)
      const solvedBoardSteps: Step[] = []
      const solvedBoard = solve(solveResults.initBoard, solvedBoardSteps)
      if (isASolvedBoard(solvedBoard)) {
        sudokuBacktracingAnimation(solvedBoardSteps)
      }
    }
  }

  function changeAnimationSpeed (e: React.ChangeEvent<HTMLInputElement>) {
    const speedFactor = (minAnimationSpeed - maxAnimationSpeed) / (parseInt(e.target.max) - parseInt(e.target.min))
    const sliderInput = parseInt(e.target.value)
    const newSpeed = Math.round(minAnimationSpeed - sliderInput * speedFactor)
    animationSpeed.current = newSpeed
  }

  function newGame () {
    window.location.reload()
  }

  function loadingState (): ReactElement[] {
    const loadingAnimation = () => {
      return (
        <div className="loading">
          <div className="loading-text">Loading...</div>
        </div>
      )
    }

    const elements = []
    elements.push(loadingAnimation())
    return elements
  }

  function configurationState (): ReactElement[] {
    const goToOnGameState = () => {
      const newBoard = generateNewBoard(solveResults.difficulty)
      setSolveResults({ wasSolvedAutomatically: false, seconds: 0, endBoard: newBoard, initBoard: newBoard, difficulty: solveResults.difficulty })
      setCurrentBoard(newBoard)
      setStateMachine({ current: 'onGame', previous: stateMachine.current })
    }
    const getDifficultyClass = (difficulty: string) => {
      let classes = 'difficulty-button'
      if (difficulty !== 'easy') {
        classes += ' difficulty-button-' + difficulty
      }
      return classes
    }
    const changeDifficulty = (difficulty: number) => {
      console.log(difficulty)
      solveResults.difficulty = difficulty
      setSolveResults(getObjectCopy(solveResults))
    }

    const difficulties = ['easy', 'medium', 'hard', 'expert'].map((difficulty, index) => {
      return (
        <button className={getDifficultyClass(difficulty) + (solveResults.difficulty === index ? ' difficulty-button-selected' : '')} key={index} onClick={() => changeDifficulty(index)}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </button>
      )
    })

    const difficultiesButtons = () => {
      return (
        <div>
          <h2 className='uiText'>Select Difficulty</h2>
          {difficulties}
        </div>
      )
    }

    const startGameButton = () => {
      return (
        <div className='button-container'>
          <button className="controls-button" onClick={goToOnGameState}>Start Game!</button>
        </div>
      )
    }

    const elements = []
    elements.push(difficultiesButtons())
    elements.push(startGameButton())
    return elements
  }

  function onGameState (): ReactElement[] {
    const boardLayout = () => {
      const board = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((row, rIdx) => {
        return (
          <tr key={rIdx} className={(row + 1) % 3 === 0 ? 'bBorder' : ''}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((col, cIdx) => {
              const cell = (
                <input
                  type="number"
                  onChange={(e) => cellInputChange(e, rIdx, cIdx)}
                  value={currentBoard[row][col] !== emptyCellIdentifier ? currentBoard[row][col] : ''}
                  className={getClassCell(row, col)}
                  disabled={
                    isABlockedCell(solveResults.initBoard, row, col) || solveAutomaticallyRequest || isASolvedBoard(currentBoard)
                  }
                />
              )
              return (
                <td key={rIdx + cIdx} className={(col + 1) % 3 === 0 ? 'rBorder' : ''}>
                  {cell}
                </td>
              )
            })}
          </tr>
        )
      })
      return (
        <table>
          <tbody>{board}</tbody>
        </table>
      )
    }

    const onGameButtons = () => {
      return (
        <div className="button-container">
          {solveAutomaticallyRequest
            ? (
                ''
              )
            : (
            <button className="controls-button" onClick={resetBoard} style={{ backgroundColor: 'tomato' }}>
              Reset
            </button>
              )}
          <button className="controls-button" onClick={solveBoard} style={{ margin: '0 3vh' }}>
            {solveAutomaticallyRequest ? 'Solving...' : 'Solve'}
          </button>
          <input className="" onChange={changeAnimationSpeed} type="range" min="0" max="100" id="speedSlider" />
          <button className="controls-button" onClick={newGame} style={{ backgroundColor: 'greenyellow' }}>
            New Game
          </button>
        </div>
      )
    }

    const elements = []
    elements.push(boardLayout())
    elements.push(onGameButtons())

    return elements
  }

  function StateMachineComponent (): ReactElement[] {
    switch (stateMachine.current) {
      case 'loading':
        return loadingState()
      case 'configuration':
        return configurationState()
      case 'onGame':
        return onGameState()

      default:
        return loadingState()
    }
  }

  return (
    <div className="sudoku">
      <div className="header">
        <h3>Sudoku</h3>
        {StateMachineComponent()}
      </div>
    </div>
  )
}

export default Sudoku
