import './styles/sudoku.css'
import React, { useState, useRef, useEffect, ReactElement } from 'react'
import {
  generateNewBoard,
  isValid,
  emptyCellIdentifier,
  solve,
  isASolvedBoard,
  isABlockedCell
} from './engines/sudokuEngine'
import StopwatchIcon from './assets/stopwatch-fill'
import RobotIcon from './assets/robot'
import type { Step } from './engines/sudokuEngine'

const minAnimationSpeed = 1000
const maxAnimationSpeed = 50

type SolveResults ={
  wasSolvedAutomatically: boolean,
  milliseconds: number,
  difficulty: number,
  endBoard: number[][],
  initBoard: number[][],
}

type StateMachine = {
  current: string,
  previous?: string,
}

type Timer = {
  startTime: number,
  endTime: number,
  timerText: string,
}

function Sudoku () {
  const [currentBoard, setCurrentBoard] = useState(getObjectCopy(generateNewBoard()))
  const [stateMachine, setStateMachine] = useState<StateMachine>({ current: 'loading' })
  const [solveResults, setSolveResults] = useState<SolveResults>({ wasSolvedAutomatically: false, milliseconds: 0, endBoard: [[]], initBoard: getObjectCopy(currentBoard), difficulty: 0 })
  const [timer, setTimer] = useState<Timer>({ startTime: new Date().getTime(), endTime: 0, timerText: '00:00' })
  const animationSpeed = useRef(maxAnimationSpeed + Math.round((minAnimationSpeed - maxAnimationSpeed) / 2))
  const intervalsIds = useRef<number[]>([])

  useEffect(() => {
    setStateMachine({ current: 'configuration', previous: 'loading' })
  }, [])

  function getObjectCopy (arr: object) {
    return JSON.parse(JSON.stringify(arr))
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
    } else if (stateMachine.current === 'automaticallySolve') {
      classes += ' cell-blocked-by-backtracking'
    }

    return classes
  }

  function resetBoard () {
    setCurrentBoard(getObjectCopy(solveResults.initBoard))
  }

  function onLoadingState (): ReactElement[] {
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

  function uiButtonsContainer (buttonsToDisplay: ReactElement[]): ReactElement {
    return (
    <div className="button-container">
      {buttonsToDisplay}
    </div>
    )
  }

  function NewGameButton (): ReactElement {
    const newGame = () => {
      window.location.reload()
    }
    return (
      <button className="controls-button" onClick={newGame} style={{ backgroundColor: 'greenyellow' }}>
        New Game!
      </button>
    )
  }

  function ResetButton (): ReactElement {
    return (
      <button className="controls-button" onClick={resetBoard} style={{ backgroundColor: 'tomato' }}>
        Reset
      </button>
    )
  }

  function Board () {
    const cellInputChange = (e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) => {
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
                  isABlockedCell(solveResults.initBoard, row, col) || stateMachine.current === 'automaticallySolve' || isASolvedBoard(currentBoard)
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

  function BoardTitle (elements: ReactElement[]): ReactElement {
    return (
      <div className='board-title'>
        {elements}
      </div>
    )
  }

  function RobotIconElement (): ReactElement {
    return (
      <RobotIcon className='icon robot-icon' />
    )
  }

  function StopwatchIconElement (): ReactElement {
    return (
      <StopwatchIcon className='icon stop-watch-icon' />
    )
  }

  function TimerText () {
    return (
      <div className='board-title-text timer-text'>{timer.timerText}</div>
    )
  }

  function onConfigurationState (): ReactElement[] {
    const goToOnGameState = () => {
      const newBoard = generateNewBoard(solveResults.difficulty)
      setSolveResults({ wasSolvedAutomatically: false, milliseconds: 0, endBoard: [[]], initBoard: newBoard, difficulty: solveResults.difficulty })
      setCurrentBoard(newBoard)
      const startTime = new Date().getTime()
      setTimer({ startTime, endTime: 0, timerText: '00:00' })
      const timerInterval = setInterval(() => {
        const calculateTimerText = (currentTime: number) => {
          const seconds = Math.floor((currentTime - startTime) / 1000)
          const minutes = Math.floor(seconds / 60)
          const secondsLeft = seconds % 60
          return `${minutes < 10 ? '0' : ''}${minutes}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`
        }
        const currentTime = new Date().getTime()
        setTimer(getObjectCopy({ startTime, endTime: currentTime, timerText: calculateTimerText(currentTime) }))
      }, 1000)
      intervalsIds.current.push(timerInterval)
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
    const uiTimer = () => {
      const elements = []
      elements.push(StopwatchIconElement())
      elements.push(TimerText())
      return (
        BoardTitle(elements)
      )
    }
    const OnGameButtons = () => {
      const goToAutomaticallySolveState = () => {
        setStateMachine({ current: 'automaticallySolve', previous: stateMachine.current })
        solveResults.wasSolvedAutomatically = true
        solveResults.milliseconds = 0
        solveResults.endBoard = [[]]
        const currentTime = new Date().getTime()
        setTimer({ startTime: currentTime, endTime: 0, timerText: '00:00' })
        setSolveResults(getObjectCopy(solveResults))
        solveBoard()
      }
      const SolveAutomaticallyButton = () => {
        return (
          <button className="controls-button" onClick={goToAutomaticallySolveState} style={{ margin: '0 3vh' }}>
            {'Solve Automatically'}
          </button>
        )
      }
      return (
        uiButtonsContainer([ResetButton(), SolveAutomaticallyButton(), NewGameButton()])
      )
    }
    if (isASolvedBoard(currentBoard)) {
      const currentTime = new Date().getTime()
      solveResults.milliseconds = currentTime - timer.startTime
      solveResults.endBoard = getObjectCopy(currentBoard)
      setSolveResults(getObjectCopy(solveResults))
      goToSolvedState()
    }

    const elements = []
    elements.push(uiTimer())
    elements.push(Board())
    elements.push(OnGameButtons())

    return elements
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

  async function sudokuBacktracingAnimation (solvedBoardSteps: Step[], delay?: number) {
    await sleep(delay || 0)
    const solveGenerator = sudokuBacktracingSteps(solvedBoardSteps)
    while (true) {
      const nextStep = solveGenerator.next()
      if (nextStep.done) {
        break
      }
      await sleep(animationSpeed.current)
    }
  }

  async function solveBoard () {
    const solvedBoardSteps: Step[] = []
    const solvedBoard = solve(solveResults.initBoard, solvedBoardSteps)
    if (isASolvedBoard(solvedBoard)) {
      sudokuBacktracingAnimation(solvedBoardSteps)
    }
  }

  function goToSolvedState () {
    if (stateMachine.current !== 'solved') {
      setStateMachine({ current: 'solved', previous: stateMachine.current })
    }
  }

  function changeAnimationSpeed (e: React.ChangeEvent<HTMLInputElement>) {
    const speedFactor = (minAnimationSpeed - maxAnimationSpeed) / (parseInt(e.target.max) - parseInt(e.target.min))
    const sliderInput = parseInt(e.target.value)
    const newSpeed = Math.round(minAnimationSpeed - sliderInput * speedFactor)
    animationSpeed.current = newSpeed
  }

  function onAutomaticallySolveState (): ReactElement[] {
    const SpeedSlider = () => {
      return (
        <input className="" onChange={changeAnimationSpeed} type="range" min="0" max="100" id="speedSlider" />
      )
    }

    if (isASolvedBoard(currentBoard)) {
      const currentTime = new Date().getTime()
      solveResults.milliseconds = currentTime - timer.startTime
      solveResults.endBoard = getObjectCopy(currentBoard)
      setSolveResults(getObjectCopy(solveResults))
      goToSolvedState()
    }

    const boardTitleElements = []
    boardTitleElements.push(RobotIconElement())
    boardTitleElements.push(<div className='board-title-text'>{'Solving with a backtracking algorithm'}</div>)

    const elements: ReactElement[] = []
    elements.push(BoardTitle(boardTitleElements))
    elements.push(Board())
    elements.push(uiButtonsContainer([SpeedSlider(), NewGameButton()]))
    return elements
  }

  function onSolvedState (): ReactElement[] {
    console.log(solveResults)
    const elements = []
    const boardTitleElements = []
    if (solveResults.wasSolvedAutomatically) {
      boardTitleElements.push(RobotIconElement())
      boardTitleElements.push(<div className='board-title-text'>{'Success!'}</div>)
    } else {
      boardTitleElements.push(StopwatchIconElement())
      boardTitleElements.push(TimerText())
    }
    elements.push(BoardTitle(boardTitleElements))
    elements.push(Board())
    elements.push(uiButtonsContainer([NewGameButton()]))
    return elements
  }

  function StateMachineComponents (): ReactElement[] {
    const clearAllIntervals = () => {
      while (intervalsIds.current.length > 0) {
        clearInterval(intervalsIds.current.shift())
      }
    }
    switch (stateMachine.current) {
      case 'loading':
        return onLoadingState()
      case 'configuration':
        clearAllIntervals()
        return onConfigurationState()
      case 'onGame':
        return onGameState()
      case 'automaticallySolve':
        clearAllIntervals()
        return onAutomaticallySolveState()
      case 'solved':
        clearAllIntervals()
        return onSolvedState()
      default:
        return onLoadingState()
    }
  }

  return (
    <div className="sudoku">
      <div className="header">
        <h3>Sudoku</h3>
          {StateMachineComponents()}
      </div>
    </div>
  )
}

export default Sudoku
