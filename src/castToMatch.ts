
/**
 * Used with generic methods to attempt to cast the actual type of value
 * to the type of the matchType. This is needed because doing something like:
 *  - v as number
 * won't actually convert it to a number if v was say a string.
 * @param value
 * @param matchType
 */
export const castToMatch = <T extends unknown>(value: unknown, matchType: T): T => {
  if (typeof value === typeof matchType || typeof matchType === 'object') {
    return value as T; // We don't have any casting to do, return what we have.
  }

  switch (typeof matchType) {
    case 'bigint':
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'bigint' || typeof value === 'boolean') {
        return BigInt(value) as T;
      }
      throw new Error('Cannot convert [object Object] to a BigInt');
    case 'number':
      return Number(value) as T;
    case 'boolean':
      return Boolean(value) as T;
    case 'string':
      return String(value) as T;
    default:
      return value as T;
  }
};
