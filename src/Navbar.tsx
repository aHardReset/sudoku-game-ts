import './styles/navbar.css'

function Navbar () {
  return (
    // create a beautiful navbar
    <nav className="nav">
      <a className="site-title" href="/">
        Aaron Garibay
      </a>
      <ul>
        <li>
          <a className="nav-link" href="/">
            Link A
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
