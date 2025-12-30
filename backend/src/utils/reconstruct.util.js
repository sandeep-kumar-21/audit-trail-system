export const reconstructState = (events) => {
  let state = null;

  for (const event of events) {
    if (event.action === "create") {
      state = {};
      for (const key in event.diff) {
        state[key] = event.diff[key].new;
      }
    }

    if (event.action === "update" && state) {
      for (const key in event.diff) {
        state[key] = event.diff[key].new;
      }
    }

    if (event.action === "delete") {
      state = null;
    }
  }

  return state;
};
