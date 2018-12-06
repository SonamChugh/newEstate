import { getValue, setValue } from './memory-cache';


describe('simple memory cache', function () {

  it('should check expiration time functionality', (done) => {

    const key = '__test1__';
    const value = 'bear_in_mind';
    const duration = 1000;
    let callbackCalled = 0;

    setValue(key, value, {
      duration: duration,
      expiredCallback: () => callbackCalled += 1
    });

    // call again with the same key
    setValue(key, value, {
      duration: duration,
      expiredCallback: () => callbackCalled += 1
    });

    setTimeout(() => expect(getValue(key)).toBe(value), 500);

    setTimeout(() => {

      expect(getValue(key)).toBeNull();
      expect(callbackCalled).toBe(1);
      done();

    }, 2000);

  });

});
