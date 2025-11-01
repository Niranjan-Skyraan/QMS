// utils/formatDuration.js
import dayjs from 'dayjs';
import duration from 'dayjs/plugin/duration';

dayjs.extend(duration);

export const formatDuration = (start, end) => {
  if (!start || !end) return '';

  const inTime = dayjs(start);
  const outTime = dayjs(end);
  const diffMinutes = outTime.diff(inTime, 'minute');

  const dur = dayjs.duration(diffMinutes, 'minutes');
  const hours = Math.floor(dur.asHours());
  const minutes = dur.minutes();

  return `${hours} hrs ${minutes} mins`;
};
