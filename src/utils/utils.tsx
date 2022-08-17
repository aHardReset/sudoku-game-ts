const calculateTimerText = (milliseconds: number) => {
  const seconds = Math.floor(milliseconds / 1000)
  const minutes = Math.floor(seconds / 60)
  const secondsLeft = seconds % 60
  return `${minutes < 10 ? '0' : ''}${minutes}:${secondsLeft < 10 ? '0' : ''}${secondsLeft}`
}

export { calculateTimerText }
