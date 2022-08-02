import "./styles/navbar.css"

function Navbar() {
    return (
        // create a beautiful navbar
        <nav className="nav">
            <a className="site-title" href="/">Aaron Garibay</a>
            <ul>
                <li><a className="nav-link" href="/">A</a></li>
                <li><a className="nav-link" href="/">B</a></li>
            </ul>

        </nav>
    )
}

export default Navbar;