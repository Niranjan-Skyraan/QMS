const getDuration = (intervals) => {
  const totalSeconds = intervals.reduce((acc, interval) => {
    const start = new Date(interval.start)
    const end = new Date(interval.end)
    return acc + (end - start) / 1000
  }, 0)

  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = Math.floor(totalSeconds % 60)

  if (hours >= 1) {
    return `${hours.toFixed(1)} hr${hours === 1 ? '' : 's'}`
  } else if (minutes >= 1) {
    return `${minutes} min${minutes === 1 ? '' : 's'}`
  } else {
    return `${seconds} sec${seconds === 1 ? '' : 's'}`
  }
}

export default getDuration
