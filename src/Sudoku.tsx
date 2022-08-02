import "./styles/sudoku.css"
import React, { useState } from "react";
import { generateNewBoard, isValid } from "./engines/sudokuEngine";

const emptyCellIdentifier = -1;
const dummyBoard: number[][] = generateNewBoard();

function Sudoku() {
    const [sudokuArr, setSudokuArr] = useState(getDeepCopy(dummyBoard));

    function getDeepCopy(arr: number[][]) {
        return JSON.parse(JSON.stringify(arr))
    }

    function onInputChange(e: React.ChangeEvent<HTMLInputElement>, row: number, col: number) {
        let val = parseInt(e.target.value) || emptyCellIdentifier;
        let grid = getDeepCopy(sudokuArr);

        let isValidValue = (val: number) => {
            return val === -1 || (val >= 1 && val <= 9);
        }

        if (isValidValue(val) ){
            grid[row][col] = val;
            setSudokuArr(grid);
        }
    }

    function isBlockedCell(row: number, col: number): boolean{
        return dummyBoard[row][col] !== emptyCellIdentifier;
    }

    function getClassCell(row: number, col: number): string {
        let classes = "cell-input";
        if (isBlockedCell(row, col)){
            classes += " cell-blocked";
        }      
        else if(sudokuArr[row][col] !== emptyCellIdentifier && !isValid(getDeepCopy(sudokuArr), sudokuArr[row][col], row, col)){
            classes += " cell-not-valid";
        }

        return classes

    }
    
    function resetBoard() {
        setSudokuArr(getDeepCopy(dummyBoard));
    }

    const board = [0, 1, 2, 3, 4, 5, 6, 7, 8].map((row, rIdx) => {
        return (
            <tr key={rIdx} className={(row+1) % 3 === 0 ? "bBorder" : ""}>
                {[0, 1, 2, 3, 4, 5, 6, 7, 8].map((col, cIdx) => {
                    

                    let cell = <input
                        type="number"
                        onChange={(e) => onInputChange(e, rIdx, cIdx)}
                        value={sudokuArr[row][col] !== emptyCellIdentifier ? sudokuArr[row][col] : "" } 
                        className={getClassCell(row, col)}
                        disabled={isBlockedCell(row, col)}
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
                    <button className="controls-button" onClick={resetBoard} style={{backgroundColor: "tomato"}}>Reset</button>
                    <button className="controls-button" style={{margin: "0 3vh"}} >Solve</button>
                    <button className="controls-button" style={{backgroundColor: "greenyellow"}}>Check</button>
                </div>
            </div>
        </div>
    )
}

export default Sudoku;