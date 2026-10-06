'use strict';

/**
 * An utility module containing helper methods.
 * @module utils
 * @private
 */

/**
 * Generate a random alpha-numeric string with a given length.
 *
 * @param {number} [len=12] - The length of the string
 * @returns {string} A random alpha-numeric string
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
 *
 * @returns {string} A numeric string
 */
export const getNumericID = ((_) => {
  let now;
  let next = Math.floor(Number.MAX_SAFE_INTEGER * Math.random());

  return () => {
    now = next;
    next = next + 1;
    if (next >= Number.MAX_SAFE_INTEGER) next = 0;
    return '' + now;
  };
})();

/**
 * @typedef {Object} CircularIterator
 * @property {function} nextElem - Advance the iterator and get the new element
 * @property {function} currElem - Get the current element without advancing
 */

/**
 * Generate a circular iterator from an array.
 *
 * @param {Array} list - The array that must be iterated
 * @returns {CircularIterator} The generated iterator
 */
export const newIterator = (list: any) => {
  const l = Array.from(list);
  const len = l.length;
  var i = 0;

  /** @type {CircularIterator} */
  const iterator = {
    nextElem: () => l[i++ % len],
    currElem: () => l[i % len],
  };

  return iterator;
};
