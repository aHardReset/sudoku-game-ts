import './styles/navbar.css'
import linkedIn from './assets/linkedin.svg'

function Navbar () {
  return (
    // create a beautiful navbar
    <nav className="nav">
      <a className="site-title" href="/">
        Aaron Garibay
      </a>
      <ul>
        <li>
          <a href="#">
            {"Let's get in touch ->"}
          </a>
        </li>
        <li>
          <a href="https://linkedin.com/in/AaronGaribay" target="_blank" rel='noreferrer'>
            <img src={linkedIn} className="logo linkedin" alt="LinkedIn Logo" />
          </a>
        </li>
        <li>
          <a className="nav-link" href="/">
            Link B
          </a>
        </li>
      </ul>
    </nav>
  )
}

export default Navbar
