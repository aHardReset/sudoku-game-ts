import React from 'react'
import ReactDOM from 'react-dom/client'

import Navbar from './Navbar'
// import App from './App'
import Sudoku from './Sudoku'
import Home from './Home'

import './styles/global.css'

/* ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <LeaderBoardComponent />
  </React.StrictMode>
) */

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Navbar />
    { window.location.pathname === '/' && <Home /> }
    { window.location.pathname === '/sudoku-backtracking' && <Sudoku /> }
  </React.StrictMode>
)
