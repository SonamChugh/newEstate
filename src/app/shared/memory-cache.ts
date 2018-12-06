const storage = {};
const keyTimer = {};


interface MemoryCacheOptions {
  duration?: number;
  expiredCallback?: () => any;
}


export function setValue(key: string, value: any, options: MemoryCacheOptions = {}) {

  if (keyTimer.hasOwnProperty(key)) {
    clearTimeout(keyTimer[key]);
    delete keyTimer[key];
  }

  storage[key] = value;

  const duration = options.duration;

  if (duration && duration > 0) {

    keyTimer[key] = setTimeout(() => {

      if (storage.hasOwnProperty(key)) {
        delete storage[key];
      }

      if (options.expiredCallback) {
        options.expiredCallback.call(this);
      }

    }, duration);
  }
}

export function getValue(key: string): any {
  return storage[key] || null;
}
