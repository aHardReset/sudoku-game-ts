import React, { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import './styles/navbar.css'
import LinkedInIcon from './assets/linkedin'

const languageStore = 'language'
function Navbar () {
  const [_, i18n] = useTranslation() // eslint-disable-line no-unused-vars

  useEffect(() => {
    const actualLanguage = localStorage.getItem(languageStore)
    if (actualLanguage === null) {
      const en = 'en'
      localStorage.setItem(languageStore, en)
    } else {
      i18n.changeLanguage(actualLanguage)
    }
  }, [])

  function getCurrentLanguage (): string {
    return localStorage.getItem(languageStore) || 'en'
  }

  function changeLanguage (e: React.ChangeEvent<HTMLSelectElement>): void {
    i18n.changeLanguage(e.target.value)
    localStorage.setItem(languageStore, e.target.value)
  }

  return (
    // create a beautiful navbar
    <nav className="nav">
      <a className="site-title" href="/">
        Aaron Garibay
      </a>
      <ul>
        {/* selector with options for two languages */}
        <li className='language-selector'>
          <select defaultValue={getCurrentLanguage()} onChange={ changeLanguage }>
            <option value="en">{'🌐 English'}</option>
            <option value="es">{'🌐 Español'}</option>
          </select>
        </li>
        <li>
          <a href="https://linkedin.com/in/AaronGaribay" target="_blank" rel='noreferrer'>
            <LinkedInIcon className='navbar-icon linkedin-icon' />
          </a>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar

/*
<li className='language-selector' >
  <select name="language" id="language">
    <option value="en">English</option>
    <option value="es">Español</option>
  </select>
</li>
*/
