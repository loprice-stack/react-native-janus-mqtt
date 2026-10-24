/**
 * An utility module containing helper methods.
 */

/**
 * Generate a random alpha-numeric string with a given length.
 *
 */
export const randomString = (len = 12) => {
  const charSet =
    'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let randomString = '';
  for (let i = 0; i < len; i++) {
    let randomPoz = Math.floor(Math.random() * charSet.length);
    randomString += charSet.substring(randomPoz, randomPoz + 1);
  }
  return randomString;
};

/**
 * Return (and increment) the value of a counter, starting from a random seed.
 * The counter starts from 0 after reaching Number.MAX_SAFE_INTEGER.
 */
export const getNumericID = (() => {
  let now;
  let next = Math.floor(Number.MAX_SAFE_INTEGER * Math.random());

  return () => {
    now = next;
    next = next + 1;
    if (next >= Number.MAX_SAFE_INTEGER) next = 0;
    return '' + now;
  };
})();

export let isDebug: boolean = false;

export const Logger = (message: any) => {
  if (isDebug) {
    console.log(message);
  }
};
