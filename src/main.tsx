import React from 'react'
import ReactDOM from 'react-dom/client'

import Navbar from './Navbar'
import Sudoku from './Sudoku'
import Home from './Home'

import { I18nextProvider } from 'react-i18next'
import i18next from 'i18next'

import './styles/global.css'
import globalEs from './translations/es/sudoku.json'
import globalEn from './translations/en/sudoku.json'

i18next.init({
  lng: 'en',
  interpolation: { escapeValue: false },
  resources: {
    en: {
      sudoku: globalEn
    },
    es: {
      sudoku: globalEs
    }
  }
})

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18next}>
      <Navbar />
      <Sudoku />
    </I18nextProvider>
  </React.StrictMode>
)
