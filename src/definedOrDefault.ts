import {castToMatch} from './castToMatch';

/**
 * just like orDefault function, except will only return the default when v is null or undefined.
 * This allows for other falsy values like 0.
 * @param v value to evaluate and return when defined.
 * @param def value to return when v is not defined.
 */
export const definedOrDefault = <T extends unknown>(v: T, def: T): T =>
  (v !== undefined && v != null) ? castToMatch(v, def) : def;
