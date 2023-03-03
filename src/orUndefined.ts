

/**
 * Will return given value if truthy, but return undefined if not truthy.
 * Handy for preventing empty strings and such from being serialized to JSON response.
 * @param v value to return if truthy.
 */
export const orUndefined = (v: any) => v || undefined;


