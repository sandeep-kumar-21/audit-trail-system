export const computeDiff = (oldData = {}, newData = {}) => {
  const diff = {};

  for (const key of Object.keys(newData)) {
    if (oldData[key] !== newData[key]) {
      diff[key] = {
        old: oldData[key],
        new: newData[key]
      };
    }
  }

  return diff;
};



