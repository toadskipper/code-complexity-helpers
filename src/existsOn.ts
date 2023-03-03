import {getFrom} from './getFrom';

export const existsOn = (context: any, path: string | string[]): boolean => getFrom(context, path) !== undefined;
