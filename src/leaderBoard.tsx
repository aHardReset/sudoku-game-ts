
type LeaderInfo = {
  nickname: string;
  milliseconds: number;
}

const maria: LeaderInfo = {
  nickname: 'Maria',
  milliseconds: 10000,
}

const john: LeaderInfo = {
  nickname: 'John',
  milliseconds: 20000,
}

const randy: LeaderInfo = {
  nickname: 'Randy',
  milliseconds: 30000,
}

const richard: LeaderInfo = {
  nickname: 'Richard',
  milliseconds: 40000,
}

const leaderBoard: LeaderInfo[] = [maria, randy, richard, john,]
leaderBoard.sort((a, b) => a.milliseconds - b.milliseconds)
console.log(leaderBoard)

export default leaderBoard
