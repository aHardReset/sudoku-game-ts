import leaderBoard from './leaderBoard'
import './styles/leaderBoard.css'

function calculateTimerText (milliseconds: number): string {
  const seconds = Math.floor((milliseconds) / 1000)
  const minutes = Math.floor(seconds / 60)
  const secondsLeft = seconds % 60
  return `${minutes < 10 ? '0' : ''}${minutes}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`
}

function LeaderBoardComponent () {
  return (
    <div className='leader-board'>
      <header className='leader-board-header'>
        <h1 className='leader-board-header-text'>Top 10</h1>
      </header>
      <table className='leader-board-table'>
        <thead className='leader-board-thead'>
          <tr className='leader-board-tr'>
            <th className='leader-board-th position-thead'>{'Pos'}</th>
            <th className='leader-board-th nickname-thead'>{'Nickname'}</th>
            <th className='leader-board-th time-thead'>{'Time'}</th>
          </tr>
        </thead>
        <tbody className='leader-board-tbody'>
          {leaderBoard.map(({ nickname, milliseconds }, index) => (
            <tr className='leader-board-tr' key={index}>
              <td className='leader-board-td leader-board-position'>{index + 1}</td>
              <td className='leader-board-td leader-board-nickname'>{nickname}</td>
              <td className='leader-board-td leader-board-time'>{calculateTimerText(milliseconds)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default LeaderBoardComponent
