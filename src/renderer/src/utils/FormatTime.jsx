// utils/formatTime.js
export const formatTime = (time, status = '') => {
  const currentTime = new Date();
  const targetTime = new Date(time);
  const diffInSeconds = Math.floor((currentTime - targetTime) / 1000);

  const diffInMinutes = Math.floor(diffInSeconds / 60);
  const diffInHours = Math.floor(diffInMinutes / 60);
  const diffInDays = Math.floor(diffInHours / 24);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInMinutes < 1) {
    return 'Just now';
  } else if (diffInMinutes < 60) {
    return `${diffInMinutes} min${status !== 'inmeeting' ? ' ago' : ''}`;
  } else if (diffInHours < 24) {
    return `${diffInHours}h${status !== 'inmeeting' ? ' ago' : ''}`;
  } else if (diffInDays < 30) {
    return `${diffInDays} day${diffInDays > 1 ? 's' : ''}${status !== 'inmeeting' ? ' ago' : ''}`;
  } else {
    return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''}${status !== 'inmeeting' ? ' ago' : ''}`;
  }
};
