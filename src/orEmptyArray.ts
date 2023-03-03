
/**
 * A shortcut method for orDefault(v, []]);
 * @param v value to evaluate and return when truthy.
 */
export function orEmptyArray<T>(v: T | T[]): T[] {
  if (Array.isArray(v)) {
    return v;
  } else {
    return [] as T[];
  }
}
