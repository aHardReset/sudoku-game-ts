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
import { useTranslation } from 'react-i18next'

import './styles/sudoku.css'
import './styles/leaderBoard.css'
import StopwatchIcon from './assets/stopwatch-fill'
import RobotIcon from './assets/robot'
import ReplyFill from './assets/replyFill'
import PlusSquareFill from './assets/plusSquareFill'
import InfoCircleFill from './assets/infoCircleFill'
import ShareFill from './assets/shareFill'
import type { Step } from './engines/sudokuEngine'

const minAnimationSpeed = 1000
const maxAnimationSpeed = 20

const apiUrlStringProd = 'https://us-central1-generic-and-experiment.cloudfunctions.net/app/v1/sudoku'
const apiUrlStringDebug = 'http://localhost:5000/generic-and-experiment/us-central1/app/v1/sudoku'

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
  const [t, _] = useTranslation('sudoku') // eslint-disable-line no-unused-vars

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
        <LoadingElement text={t('loading')} />
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

  function ShareFillElement (): ReactElement {
    return (
      <ShareFill className='icon share-fill-icon' />
    )
  }

  function PlusSquareFillElement (): ReactElement {
    return (
      <PlusSquareFill className='icon trash-fill-icon' />
    )
  }

  function InfoCircleFillElement (): ReactElement {
    return (
      <InfoCircleFill className='icon info-circle-fill-icon' />
    )
  }

  function GameRulesInfo (): ReactElement {
    return (
      <div className='help'>
        {InfoCircleFillElement()}
        <span className="help-no-visible help-game-rules">
          {t('rules.rule1')}
          <br/>
          {t('rules.rule2')}
          <br/>
          {t('rules.rule3')}
        </span>
      </div>
    )
  }

  function SudokuNavbar (): ReactElement {
    const shareButton = () => {
      // share webpage in twitter with app or website link
      const url = window.location.href
      const text = t('share.text')
      const hashtags = t('share.hashtags')
      const shareUrl = `https://twitter.com/intent/tweet?text=${text}&url=${url}&hashtags=${hashtags}`
      // window open noreferrer
      window.open(shareUrl, '_blank', 'noreferrer')
    }
    return (
      <div className="sudoku-nav">
        <div>
          <h3 className='sudoku-nav-text'>{'Sudoku   '}</h3>
        </div>
        <div>
          { GameRulesInfo() }
        </div>
        <div className='sudoku-share' onClick={shareButton}>
          { ShareFillElement() }
        </div>
      </div>
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
          {t('difficulty.buttons.' + difficulty)}
        </button>
      )
    })

    const difficultiesButtons = () => {
      return (
        <div>
          <h2 className='select-difficulty-text'>{t('difficulty.title')}</h2>
          {difficulties}
        </div>
      )
    }

    const startGameButton = () => {
      return (
        <div className='button-container'>
          <button className="controls-button" onClick={goToOnGameState}>{t('difficulty.buttons.startGame')}</button>
        </div>
      )
    }

    return (
      <div className="sudoku-screen">
        { SudokuNavbar() }
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

  function LoadNewGameComponent () : ReactElement {
    return (
      <div className='help'>
        <button onClick={newGame}>
          {PlusSquareFillElement()}
        </button>
        <span className="help-no-visible help-ui-controls-text">{t('newGame')}</span>
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
        { SudokuNavbar() }
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
                <span className="help-no-visible help-ui-controls-text">{t('backtracking.help')}</span>
              </div>
            </div>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <button onClick={resetBoard}>
                  {ReplyFillElement()}
                </button>
                <span className="help-no-visible help-ui-controls-text">{t('resetBoard')}</span>
              </div>
            </div>
            <div className='sudoku-ui-controls-icon'>
              { LoadNewGameComponent() }
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
          <div className='speed-slider-text' >{t('animationSpeed')}</div>
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
        { SudokuNavbar() }
        <div className="sudoku-top-grid">
          <div className='sudoku-blank-side-col'></div>
          <div className='sudoku-solving-info'>
            <div className='sudoku-solving-text'>
              {t('backtracking.onAction')}
            </div>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <button>
                  {RobotIconElement()}
                </button>
                <span className="help-no-visible help-ui-controls-text">{t('backtracking.onActionExtend')}</span>
              </div>
            </div>
          </div>
          <div className='sudoku-ui-solving-items'>
            <div className='sudoku-ui-controls-icon'>
              <div className='help'>
                <div className='help-new-game'></div>
              </div>
              { LoadNewGameComponent() }
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
      let url: URL = new URL([apiUrlStringProd, 'get-leader-board'].join('/') + `/${difficulty}`)
      const headers: Headers = new Headers()

      if (['localhost', '127.0.0.1'].includes(window.location.hostname)) {
        url = new URL([apiUrlStringDebug, 'get-leader-board'].join('/') + `/${difficulty}`)
        headers.append('Authorization', 'Bearer ' + import.meta.env.VITE_BEARER_TOKEN)
      }
      const topTen = await fetch(url, { method: 'GET', headers, })
      const response = await topTen.json()
      setTopTenResults(response)
      isFetching.current = false
    }
  }

  function LeaderBoardComponent () {
    return (
      <div className='leader-board'>
        <header className='leader-board-header'>
          <h1 className='leader-board-header-text'>{t('leaderBoard.header')}</h1>
        </header>
        <table className='leader-board-table'>
          <thead className='leader-board-thead'>
            <tr className='leader-board-tr'>
              <th className='leader-board-th position-thead'>{t('leaderBoard.positionCol')}</th>
              <th className='leader-board-th nickname-thead'>{t('leaderBoard.nicknameCol')}</th>
              <th className='leader-board-th time-thead'>{t('leaderBoard.timeCol')}</th>
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
                  {t('backtracking.onFinish')}
                </div>
                <div className='sudoku-ui-controls-icon'>
                  <div className='help'>
                    <button>
                      {RobotIconElement()}
                    </button>
                    <span className="help-no-visible help-ui-controls-text">{'Board is solved'}</span>
                  </div>
                </div>
              </div>
              <div className='sudoku-ui-solving-items'>
              <div className='sudoku-ui-controls-icon'>
                <div className='help'>
                  <div className='help-new-game'></div>
                </div>
                { LoadNewGameComponent() }
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
                { LoadNewGameComponent() }
              </div>
            </div>
            <div className='sudoku-blank-side-col'></div>
          </React.Fragment>
        )
      }
    }

    const ThanksForPlayingElement = () => {
      return (
        <h3 className='speed-slider-text'>{t('thanksForPlaying')}</h3>
      )
    }

    const TopTenCongratsComponent = () => {
      return (
        <h3 className='top-ten-congrats-text'>{t('leaderBoard.congratulations')}</h3>
      )
    }

    const TellToScrollDownComponent = () => {
      return (
        <h3 className='scroll-down-text '>{t('scrollHelp')}</h3>
      )
    }

    const RegisterNicknameComponent = () => {
      const registerNickname = async () => {
        if (!isFetching.current) {
          isFetching.current = true
          const difficulty = solveResults.difficulty.toString()
          const url: URL = new URL([apiUrlStringDebug, 'register-new-result'].join('/'))
          console.log(url)
          const headers = new Headers()
          headers.append('Content-Type', 'application/json')
          headers.append('Access-Control-Allow-Headers', 'Content-Type')

          const body = {
            nickname: newTopTenData.nickname,
            difficulty,
            milliseconds: solveResults.milliseconds,
          }
          newTopTenData.posting = true
          const response = await fetch(url, {
            method: 'POST',
            body: JSON.stringify(body),
            headers,
          })
          const newTable = await response.json()
          if (response.status === 201) {
            setTopTenResults(newTable)
            newTopTenData.isPosted = true
            setNewTopTenData(getObjectCopy(newTopTenData))
          }
          console.log(newTable)
          isFetching.current = false
        }
      }

      const nicknameOnChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        newTopTenData.nickname = e.target.value
        setNewTopTenData(getObjectCopy(newTopTenData))
      }

      const isAValidNickName = () => {
        return newTopTenData.nickname.length >= 3 && newTopTenData.nickname.length <= 20
      }

      return (
        <div className='sudoku-register-nickname'>
          <div className='sudoku-register-nickname-text'>
            <h3 className='top-ten-congrats-text'>{t('leaderBoard.topTenAware')}</h3>
            <input className='sudoku-register-nickname-input' onChange={nicknameOnChange} disabled={newTopTenData.posting} value={newTopTenData.nickname} type='text' placeholder={t('leaderBoard.placeHolder')} />
            <button className='sudoku-register-nickname-button' disabled={!isAValidNickName() || newTopTenData.posting} onClick={registerNickname}>{t('leaderBoard.sendResult')}</button>
            {!isAValidNickName() && <div className='sudoku-register-nickname-error'>{t('leaderBoard.nicknameError')}</div>}
          </div>
        </div>
      )
    }

    const UiBottomElements = (): ReactElement => {
      if (solveResults.wasSolvedAutomatically || !newTopTenData.isPosted) {
        if (topTenResults.length === 0) {
          return (
            <div className='ui-bottom-elements'>
              {ThanksForPlayingElement()}
              <h3 className='sudoku-loading-leader-board'>{t('loading')}</h3>
            </div>
          )
        }
        if (solveResults.milliseconds < topTenResults[9].milliseconds && !solveResults.wasSolvedAutomatically) {
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
        { SudokuNavbar() }
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

export default Sudoku
