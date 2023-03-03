
/**
 * A shortcut method for orDefault(v, '');
 * @param v value to evaluate and return when truthy.
 */
export const orEmptyString = (v: unknown): string => v ? String(v) : '';
