export const getQueryTime = (tim) => {
  let rtn = ' SINCE 30 minutes ago '
  if (tim && tim.duration && tim.duration > 0) {
    rtn = ` SINCE ${tim.duration / 1000} seconds ago `
  } else if (tim && tim.begin_time && tim.end_time) {
    rtn = ` SINCE ${tim.begin_time / 1000} UNTIL ${tim.end_time / 1000} `
  }
  return rtn;
};

export const getFromToQueryTime = (begin, end) => {
  let rtn = '';

  if (begin) {
    rtn += ` SINCE ${begin/1000} `;
  }
  if (end) {
    rtn += ` UNTIL ${end/1000 + 1} `;
  }

  return rtn;
};

export const tidyNumber = (num) => {
  if (num === null || num === undefined) {
    return 'n/a';
  }

  return num.toFixed(2);
};

export const getDateTime = (timestamp, timeZone) => {
  if (!timestamp) {
    return 'n/a';
  }
  const date = new Date(timestamp);
  return date.toLocaleString('en-GB', { timeZone: timeZone });
};