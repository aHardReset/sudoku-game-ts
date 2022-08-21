
function Home () {
  // a beautiful portfolio home page component
  return (
    <div className="home">
      <h1>Welcome to my portfolio!</h1>
      <p>
        Here I will post some projects related to software engineering. This home page is under construction.
      </p>
      <p>
        Currently I only have a Sudoku game that can auto solve itself using a backtracking algorithm.
        {/* link to the sudoku game */}
        <a href="/sudoku-backtracking">Click here to play!</a>
      </p>
      <p>
        {/* Invite the user to visit my linkedin page */ }
        If you want to contact me for professional opportunities or to see my resume,
        <a href="https://linkedin.com/in/aarongaribay" target="_blank" rel="noreferrer"> please visit my linkedin page.</a>
      </p>

    </div>
  )
}

export default Home
