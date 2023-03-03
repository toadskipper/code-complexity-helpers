
/**
 * Sets a deeply nested object value
 *
 * usage:
 * > setOn($scope, 'model.readSettings.binCount', 500);
 * @param context   Root object reference
 * @param path      Dot-delimited string or array with nested property names.
 * @param value     Value to set
 * @returns         Returns value set or undefined if unable to set value.
 */
export const setOn = (context: any, path: string | string[], value: any) => {
  let parts;
  let ps: string | undefined;
  let p: string;

  if (!context || typeof context !== 'object') {
    return undefined;
  }
  let obj: any = context;

  if (typeof path === 'string') {
    parts = path.split('.');
  } else if (Object.prototype.toString.call(path) === '[object Array]') {
    parts = path.slice();
  } else {
    return undefined;
  }

  const prop = parts.pop();

  while (obj && typeof obj === 'object' && parts.length) {
    ps = parts.shift();
    if (ps === undefined) {
      return undefined;
    }
    p = ps;
    if (obj[p] === null || obj[p] === undefined) {
      obj[p] = {};
    }
    obj = obj[p];
  }

  // Only return the value if it is set successfully.
  if (obj && typeof obj === 'object' && prop) {
    obj[prop] = value;
    return obj[prop];
  }
  return undefined;
};
