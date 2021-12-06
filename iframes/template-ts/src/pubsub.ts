const pubSub = () => {
  const subscribers = {};
  return {
    subscribe: function (event: string | number, callback) {
      subscribers[event] = subscribers[event] || [];
      subscribers[event].push(callback);
    },
    publish: function (event: string | number, ...args) {
      if (subscribers && subscribers[event]) {
        const subs = subscribers[event];
        for (let n = 0, max = subs.length; n < max; n++) {
          subs[n](...args);
        }
      }
    },
  };
};

const eventEmitter = pubSub();

export default eventEmitter;
