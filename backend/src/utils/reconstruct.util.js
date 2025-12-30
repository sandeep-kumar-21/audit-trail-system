export const reconstructState = (events = []) => {
  let state = {};

  for (const event of events) {
    if (event.action === "create") {
      state = {};
      for (const key in event.diff) {
        state[key] = event.diff[key].new;
      }
    }

    if (event.action === "update") {
      for (const key in event.diff) {
        state[key] = event.diff[key].new;
      }
    }

    if (event.action === "delete") {
      state = {};
    }
  }

  return JSON.parse(JSON.stringify(state));
};
