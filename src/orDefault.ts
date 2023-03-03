import {castToMatch} from './castToMatch';

/**
 * AKA truthy or default. Will fallback to default value when v is:
 * - undefined
 * - null
 * - 0
 * - ''
 * - false
 * @param v value to evaluate and return when truthy.
 * @param def value to return when v is falsy.
 */
export const orDefault = <T extends unknown>(v: unknown, def: T): T => v ? castToMatch(v, def) : def;
