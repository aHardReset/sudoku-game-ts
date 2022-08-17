import React from 'react'
import ReactDOM from 'react-dom/client'

import Navbar from './Navbar'
// import App from './App'
import LeaderBoardComponent from './components/sudoku/LeaderBoardComponent'
import Sudoku from './Sudoku'

import './styles/global.css'

/* ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LeaderBoardComponent />
  </React.StrictMode>
) */

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Navbar />
    <Sudoku />
  </React.StrictMode>
)
