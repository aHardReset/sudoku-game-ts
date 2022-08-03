import "./styles/sudoku.css"
import React, { useState, useRef } from "react";
import { generateNewBoard, isValid, emptyCellIdentifier, solve, isASolvedBoard} from "./engines/sudokuEngine";

import type {Step} from "./engines/sudokuEngine";

const minAnimationSpeed = 1000
const maxAnimationSpeed = 50
const initBoard = generateNewBoard()
function Sudoku() {
    const [currentBoard, setCurrentBoard] = useState(getDeepCopy(initBoard));
    const animationSpeed = useRef(maxAnimationSpeed + Math.round((minAnimationSpeed - maxAnimationSpeed) / 2));
    const [solveAutomaticallyRequest, setSolveAutomaticallyRequest] = useState(false);

    function getDeepCopy(arr: number[][]) {
        return JSON.parse(JSON.stringify(arr))
    }

    function onInputChange(e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) {
        let val = parseInt(e.target.value) || emptyCellIdentifier;
        let grid = getDeepCopy(currentBoard);

        let isValidValue = (val: number) => {
            return val === -1 || (val >= 1 && val <= 9);
        }

        if (isValidValue(val) ){
            grid[row][col] = val;
            setCurrentBoard(grid);
        }
    }

    function isBlockedCell(row: number, col: number): boolean{
        return initBoard[row][col] !== emptyCellIdentifier;
    }

    function getClassCell(row: number, col: number): string {
        let classes = "cell-input";
        if (isBlockedCell(row, col)){
            classes += " cell-blocked";
        } else if(currentBoard[row][col] !== emptyCellIdentifier && !isValid(getDeepCopy(currentBoard), currentBoard[row][col], row, col)){
            classes += " cell-not-valid";
        } else if(isASolvedBoard(currentBoard)) {
          classes += " cell-blocked-by-solved-board";
        } else if (solveAutomaticallyRequest){
          classes += " cell-blocked-by-backtracking";
        }

        return classes

    }
    
    function resetBoard() {
        setCurrentBoard(getDeepCopy(initBoard));
    }

    function sleep(ms: number) {
      return new Promise(resolve => setTimeout(resolve, ms));
    }


    function*sudokuBacktracingSteps(steps: Step[]) {
      let currentStep = steps.shift()
      while (currentStep !== undefined) {
        const row: number = currentStep.row;
        const col: number = currentStep.col;
        const val: number = currentStep.val;
        currentBoard[row][col] = val;
        setCurrentBoard(getDeepCopy(currentBoard));
        yield
        currentStep = steps.shift()
      }
    }

    async function sudokuBacktracingAnimation(solvedBoardSteps: Step[]) {
        let solveGenerator = sudokuBacktracingSteps(solvedBoardSteps);
        for (let _ of solveGenerator) {
          await sleep(animationSpeed.current);
        }
        setSolveAutomaticallyRequest(false)
      }


    async function solveBoard() {
        if(solveAutomaticallyRequest === false){setCurrentBoard(initBoard);
          setSolveAutomaticallyRequest(true)
          let solvedBoardSteps: Step[] = [];
          let solvedBoard = solve(initBoard, solvedBoardSteps)
          if (isASolvedBoard(solvedBoard)) {
              sudokuBacktracingAnimation(solvedBoardSteps);
          }
        }
                
    }

    function changeAnimationSpeed(e: React.ChangeEvent<HTMLInputElement>) {
        
        const speedFactor = (minAnimationSpeed - maxAnimationSpeed) / (parseInt(e.target.max) - parseInt(e.target.min))
        const sliderInput = parseInt(e.target.value)
        const newSpeed = Math.round(minAnimationSpeed - (sliderInput * speedFactor))
        animationSpeed.current = newSpeed
        
    }

    function newGame() {
      window.location.reload()
    }

    const board = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((row, rIdx) => {
        return (
            <tr key={rIdx} className={(row+1) % 3 === 0 ? "bBorder" : ""}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((col, cIdx) => {
                    

                    let cell = <input
                        type="number"
                        onChange={(e) => onInputChange(e, rIdx, cIdx)}
                        value={currentBoard[row][col] !== emptyCellIdentifier ? currentBoard[row][col] : "" } 
                        className={getClassCell(row, col)}
                        disabled={isBlockedCell(row, col) || solveAutomaticallyRequest || isASolvedBoard(currentBoard)}
                    />
                    return <td key={rIdx + cIdx} className={(col+1) % 3 === 0 ? "rBorder" : ""}>
                        {cell}
                    </td>
                })}
            </tr>
        )
        })

    return (
        <div className="sudoku">
            <div className="header">
                <h3>Sudoku</h3>
                <table>
                    <tbody>
                        {board}
                    </tbody>
                </table>

                <div className="button-container">
                    {solveAutomaticallyRequest ? "" : <button className="controls-button" onClick={resetBoard} style={{backgroundColor: "tomato"}}>Reset</button>}
                    <button className="controls-button" onClick={solveBoard} style={{margin: "0 3vh"}} >{solveAutomaticallyRequest ? "Solving..." : "Solve"}</button>
                    <input className= "" onChange={changeAnimationSpeed} type="range" min="0" max="100"  id="speedSlider"/>
                    <button className="controls-button" onClick={newGame} style={{backgroundColor: "greenyellow"}}>New Game</button>
                </div>
            </div>
        </div>
    )
}

export default Sudoku;