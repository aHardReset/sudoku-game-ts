import './styles/sudoku.css'
import './styles/leaderBoard.css'
import React, { useState, useRef, useEffect, ReactElement } from 'react'
import {
  generateNewBoard,
  isValid,
  emptyCellIdentifier,
  solve,
  isASolvedBoard,
  isABlockedCell
} from './engines/sudokuEngine'
import { calculateTimerText } from './utils/utils'

import StopwatchIcon from './assets/stopwatch-fill'
import RobotIcon from './assets/robot'
import ReplyFill from './assets/replyFill'
import TrashFill from './assets/trashFill'
import InfoCircleFill from './assets/infoCircleFill'
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

type LeaderBoardEntry = {
  nickname: string,
  milliseconds: number,
}

type NewTopTen = {
  nickname: string,
  posting: boolean,
  isPosted: boolean,
}

function Sudoku () {
  const [currentBoard, setCurrentBoard] = useState(getObjectCopy(generateNewBoard()))
  const [stateMachine, setStateMachine] = useState<StateMachine>({ current: 'loading' })
  const [solveResults, setSolveResults] = useState<SolveResults>({ wasSolvedAutomatically: false, milliseconds: 0, endBoard: [[]], initBoard: getObjectCopy(currentBoard), difficulty: 0 })
  const [timer, setTimer] = useState<Timer>({ startTime: new Date().getTime(), endTime: 0, timerText: '00:00' })
  const [topTenResults, setTopTenResults] = useState<LeaderBoardEntry[]>([])
  const [newTopTenData, setNewTopTenData] = useState<NewTopTen>({ nickname: '', isPosted: false, posting: false })
  const animationSpeed = useRef(maxAnimationSpeed + Math.round((minAnimationSpeed - maxAnimationSpeed) / 2))
  const intervalsIds = useRef<number[]>([])
  const isFetching = useRef(false)

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

  type LoadingProps = {
    text: string,
  }

  function LoadingElement (props: LoadingProps) {
    return (
      <div className="loading-grid">
        <div className="loading-text">{props.text}</div>
      </div>
    )
  }

  function onLoadingState (): ReactElement {
    return (
      <div>
        <LoadingElement text="Loading..." />
      </div>
    )
  }

  const newGame = () => {
    window.location.reload()
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

  function ReplyFillElement (): ReactElement {
    return (
      <ReplyFill className='icon reply-fill-icon' />
    )
  }

  function TrashFillElement (): ReactElement {
    return (
      <TrashFill className='icon trash-fill-icon' />
    )
  }

  function InfoCircleFillElement (): ReactElement {
    return (
      <InfoCircleFill className='icon info-circle-fill-icon' />
    )
  }

  function onConfigurationState (): ReactElement {
    const goToOnGameState = () => {
      const newBoard = generateNewBoard(solveResults.difficulty)
      setSolveResults({ wasSolvedAutomatically: false, milliseconds: 0, endBoard: [[]], initBoard: newBoard, difficulty: solveResults.difficulty })
      setCurrentBoard(newBoard)
      const startTime = new Date().getTime()
      setTimer({ startTime, endTime: 0, timerText: '00:00' })
      const timerInterval = setInterval(() => {
        const currentTime = new Date().getTime()
        const milliseconds = currentTime - startTime
        setTimer(getObjectCopy({ startTime, endTime: currentTime, timerText: calculateTimerText(milliseconds) }))
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
          <h2 className='select-difficulty-text'>{'Select Difficulty'}</h2>
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

    return (
      <div className="sudoku-screen">
        <div className="sudoku-nav">
          <h3 className='sudoku-nav-text'>
            {'Sudoku   '}
            <div className='help'>
              {InfoCircleFillElement()}
              <span className="help-no-visible help-game-rules">
                {'Rule 1 - Each row must contain the numbers from 1 to 9, without repetitions'}
                <br/>
                {' Rule 2 - Each column must contain the numbers from 1 to 9, without repetitions'}
                <br/>
                {'Rule 3 - Each 3x3 box must contain the numbers from 1 to 9, without repetitions'}

              </span>
            </div>
          </h3>
        </div>
        <div className="sudoku-main-grid sudoku-configuration">
          <div className='sudoku-blank-side-col'></div>
          <div className='sudoku-board'>
            {difficultiesButtons()}
            {startGameButton()}
          </div>
          <div className='sudoku-blank-side-col'></div>
        </div>
      </div>
    )
  }

  function onGameState (): ReactElement {
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
    if (isASolvedBoard(currentBoard)) {
      const currentTime = new Date().getTime()
      solveResults.milliseconds = currentTime - timer.startTime
      solveResults.endBoard = getObjectCopy(currentBoard)
      setSolveResults(getObjectCopy(solveResults))
      goToSolvedState()
    }

    return (
      <div className="sudoku-screen">
        <div className="sudoku-nav">
          <h3 className='sudoku-nav-text'>
            {'Sudoku   '}
            <div className='help'>
              {InfoCircleFillElement()}
              <span className="help-no-visible help-game-rules">
                {'Rule 1 - Each row must contain the numbers from 1 to 9, without repetitions'}
                <br/>
                {' Rule 2 - Each column must contain the numbers from 1 to 9, without repetitions'}
                <br/>
                {'Rule 3 - Each 3x3 box must contain the numbers from 1 to 9, without repetitions'}

              </span>
            </div>
          </h3>
        </div>
        <div className="sudoku-top-grid">
          <div className='sudoku-blank-side-col'></div>
          <div className='sudoku-timer-item'>
            <div className='sudoku-timer-icon'>
              {StopwatchIconElement()}
            </div>
            <div className='sudoku-timer-text'>
              {timer.timerText}
            </div>
          </div>
          <div className='sudoku-ui-controls-item'>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <button onClick={goToAutomaticallySolveState}>
                  {RobotIconElement()}
                </button>
                <span className="help-no-visible help-ui-controls-text">{'Attack board with backtracking'}</span>
              </div>
            </div>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <button onClick={resetBoard}>
                  {ReplyFillElement()}
                </button>
                <span className="help-no-visible help-ui-controls-text">{'Reset current board'}</span>
              </div>
            </div>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <button onClick={newGame}>
                  {TrashFillElement()}
                </button>
                <span className="help-no-visible help-ui-controls-text">{'Drop and start a new game'}</span>
              </div>
            </div>
          </div>
          <div className='sudoku-blank-side-col'></div>
        </div>
        <div className="sudoku-main-grid">
          <div className='sudoku-blank-side-col'></div>
          <div className='sudoku-board'>
            {Board()}
          </div>
          <div className='sudoku-blank-side-col'></div>
        </div>
      </div>
    )
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

  function onAutomaticallySolveState (): ReactElement {
    const SpeedSlider = () => {
      return (
        <div className='speed-slider'>
          <div className='speed-slider-text' >{'Animation Speed'}</div>
          <input className="speed-slider-input" itemID='speed-slider' onChange={changeAnimationSpeed} type="range" min="0" max="100" id="speedSlider" step={1}/>
        </div>
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

    return (
      <div className="sudoku-screen">
        <div className="sudoku-nav">
          <h3 className='sudoku-nav-text'>
            {'Sudoku   '}
            <div className='help'>
              {InfoCircleFillElement()}
              <span className="help-no-visible help-game-rules">
                {'Rule 1 - Each row must contain the numbers from 1 to 9, without repetitions'}
                <br/>
                {' Rule 2 - Each column must contain the numbers from 1 to 9, without repetitions'}
                <br/>
                {'Rule 3 - Each 3x3 box must contain the numbers from 1 to 9, without repetitions'}

              </span>
            </div>
          </h3>
        </div>
        <div className="sudoku-top-grid">
          <div className='sudoku-blank-side-col'></div>
          <div className='sudoku-solving-info'>
            <div className='sudoku-solving-text'>
              {'Using backtracking.'}
            </div>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <button>
                  {RobotIconElement()}
                </button>
                <span className="help-no-visible help-ui-controls-text">{'Attacking board with backtracking'}</span>
              </div>
            </div>
          </div>
          <div className='sudoku-ui-solving-items'>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <button onClick={newGame}>
                  {TrashFillElement()}
                </button>
                <span className="help-no-visible help-ui-controls-text">{'Drop and start a new game'}</span>
              </div>
            </div>
          </div>
          <div className='sudoku-blank-side-col'></div>
        </div>
        <div className="sudoku-main-grid">
          <div className='sudoku-blank-side-col'></div>
          <div className='sudoku-board'>
            {Board()}
            {SpeedSlider()}
          </div>
          <div className='sudoku-blank-side-col'></div>
        </div>
      </div>
    )
  }

  async function getTopTen () {
    if (topTenResults.length === 0 && !isFetching.current) {
      isFetching.current = true
      const difficulty = solveResults.difficulty.toString()
      const url: URL = new URL('http://localhost:5000/generic-and-experiment/us-central1/app/v1/sudoku/get-leader-board/' + difficulty)
      const topTen = await fetch(url, { method: 'GET', })
      const response = await topTen.json()
      setTopTenResults(response)
      isFetching.current = false
    }
  }

  function LeaderBoardComponent () {
    return (
      <div className='leader-board'>
        <header className='leader-board-header'>
          <h1 className='leader-board-header-text'>Top 10</h1>
        </header>
        <table className='leader-board-table'>
          <thead className='leader-board-thead'>
            <tr className='leader-board-tr'>
              <th className='leader-board-th position-thead'>{'Pos'}</th>
              <th className='leader-board-th nickname-thead'>{'Nickname'}</th>
              <th className='leader-board-th time-thead'>{'Time'}</th>
            </tr>
          </thead>
          <tbody className='leader-board-tbody'>
            {topTenResults.map(({ nickname, milliseconds }, index) => (
              <tr className='leader-board-tr' key={index}>
                <td className='leader-board-td leader-board-position'>{index + 1}</td>
                <td className='leader-board-td leader-board-nickname'>{nickname}</td>
                <td className='leader-board-td leader-board-time'>{calculateTimerText(milliseconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  function onSolvedState (): ReactElement {
    function UiTopElements (): ReactElement {
      if (solveResults.wasSolvedAutomatically) {
        return (
          <React.Fragment>
            <div className='sudoku-blank-side-col'></div>
            <div className='sudoku-solving-info'>
              <div className='sudoku-solving-text'>
                {'Success.'}
              </div>
              <div className='sudoku-ui-controls-icon'>
                <div className='help'>
                  <button>
                    {RobotIconElement()}
                  </button>
                  <span className="help-no-visible help-ui-controls-text">{'Attacking board with backtracking'}</span>
                </div>
              </div>
            </div>
            <div className='sudoku-ui-solving-items'>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <div className='help-new-game'></div>
              </div>
              <div className='help'>
                <button onClick={newGame}>
                  {TrashFillElement()}
                </button>
                <span className="help-no-visible help-ui-controls-text">{'Drop and start a new game'}</span>
                </div>
              </div>
            </div>
            <div className='sudoku-blank-side-col'></div>
          </React.Fragment>
        )
      } else {
        return (
          <React.Fragment>
            <div className='sudoku-blank-side-col'></div>
            <div className='sudoku-timer-item'>
              <div className='sudoku-timer-icon'>
                {StopwatchIconElement()}
              </div>
              <div className='sudoku-timer-text'>
                {timer.timerText}
              </div>
            </div>
            <div className='sudoku-ui-solving-items'>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <div className='help-new-game'></div>
              </div>
              <div className='help'>
                <button onClick={newGame}>{TrashFillElement()}
                </button>
                <span className="help-no-visible help-ui-controls-text">{'Drop and start a new game'}</span>
              </div>
            </div>
          </div>
            <div className='sudoku-blank-side-col'></div>
          </React.Fragment>
        )
      }
    }

    const ThanksForPlayingElement = () => {
      return (
        <h3 className='speed-slider-text'>{'Thanks for playing'}</h3>
      )
    }

    const TopTenCongratsComponent = () => {
      return (
        <div className='top-ten-congrats'>
          <h3 className='top-ten-congrats-text'>{'Congratulations! You made the top 10!'}</h3>
        </div>
      )
    }

    const TellToScrollDownComponent = () => {
      return (
        <h3 className='scroll-down-text '>{'⬇ Scroll down to see the top 10 ⬇'}</h3>
      )
    }

    const RegisterNicknameComponent = () => {
      const registerNickname = async () => {
        newTopTenData.isPosted = true
        newTopTenData.posting = true
        setNewTopTenData(getObjectCopy(newTopTenData))
        setTopTenResults(getObjectCopy(topTenResults))
        return
        const url: URL = new URL('http://localhost:5000/generic-and-experiment/us-central1/app/v1/sudoku/register-nickname')
        const body = {
          nickname: newTopTenData.nickname,
          difficulty: solveResults.difficulty.toString(),
          milliseconds: solveResults.milliseconds,
        }
        const response = await fetch(url, {
          method: 'POST',
          body: JSON.stringify(body)
        })
        if (response.status === 201) {
          const newTable = await response.json()
          setTopTenResults(newTable)
          newTopTenData.isPosted = true
          setNewTopTenData(getObjectCopy(newTopTenData))
        }
      }

      const nicknameOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        newTopTenData.nickname = e.target.value
        setNewTopTenData(getObjectCopy(newTopTenData))
      }

      const isAValidNickName = () => {
        return newTopTenData.nickname.length > 2 && newTopTenData.nickname.length < 20
      }

      return (
        <div className='sudoku-register-nickname'>
          <div className='sudoku-register-nickname-text'>
            <h3 className='speed-slider-text'>{'Register your nickname'}</h3>
            <input className='sudoku-register-nickname-input' onChange={nicknameOnChange} disabled={newTopTenData.posting} value={newTopTenData.nickname} type='text' placeholder='Nickname' />
            <button className='sudoku-register-nickname-button' disabled={!isAValidNickName() || newTopTenData.posting} onClick={registerNickname}>{'Register'}</button>
            {!isAValidNickName() && <div className='sudoku-register-nickname-error'>{'Nickname must be between 3 and 20 characters'}</div>}
          </div>
        </div>
      )
    }

    const UiBottomElements = (): ReactElement => {
      if (!solveResults.wasSolvedAutomatically || !newTopTenData.isPosted) {
        if (topTenResults.length === 0) {
          return (
            <div className='ui-bottom-elements'>
              {ThanksForPlayingElement()}
              <h3>{'Loading...'}</h3>
            </div>
          )
        }
        if (solveResults.milliseconds < topTenResults[9].milliseconds) {
          return (
            <div className='ui-bottom-elements'>
              {TellToScrollDownComponent()}
              {TopTenCongratsComponent()}
              {RegisterNicknameComponent()}
              {LeaderBoardComponent()}
            </div>
          )
        }
      }
      return (
        <div className='ui-bottom-elements'>
          {TellToScrollDownComponent()}
          {ThanksForPlayingElement()}
          {LeaderBoardComponent()}
        </div>
      )
    }

    if (navigator.onLine) {
      getTopTen()
    }

    return (
      <div className="sudoku-screen">
        <div className="sudoku-nav">
          <h3 className='sudoku-nav-text'>
            {'Sudoku   '}
            <div className='help'>
              {InfoCircleFillElement()}
              <span className="help-no-visible help-game-rules">
                {'Rule 1 - Each row must contain the numbers from 1 to 9, without repetitions'}
                <br/>
                {' Rule 2 - Each column must contain the numbers from 1 to 9, without repetitions'}
                <br/>
                {'Rule 3 - Each 3x3 box must contain the numbers from 1 to 9, without repetitions'}

              </span>
            </div>
          </h3>
        </div>
        <div className="sudoku-top-grid">
          {UiTopElements()}
        </div>
        <div className="sudoku-main-grid">
          <div className='sudoku-blank-side-col'></div>
          <div className='sudoku-board'>
            {Board()}
            {navigator.onLine ? UiBottomElements() : ThanksForPlayingElement()}
          </div>
          <div className='sudoku-blank-side-col'></div>
        </div>
      </div>
    )
  }

  const clearAllIntervals = () => {
    while (intervalsIds.current.length > 0) {
      clearInterval(intervalsIds.current.shift())
    }
  }

  switch ('solved') {
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

export default Sudoku
