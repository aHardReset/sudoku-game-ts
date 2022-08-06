import React from 'react'
import ReactDOM from 'react-dom/client'

import Navbar from './Navbar'
// import App from './App'
import Sudoku from './Sudoku'

import './styles/global.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <Navbar />
    <Sudoku />
  </React.StrictMode>
)
