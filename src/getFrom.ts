/**
 * Created by Patrick Tafoya on 4/28/2015.
 *   Ported to TypeScript on 4/20/2020.
 *   Added generics and casting on 2/25/2023.
 */

// What is it?
/**
 * To get and set values on deeply nested objects easily.
 * to solve the problem:
 *    if($scope && $scope.model && $scope.model.readSettings && $scope.model.readSettings.binCount){
 *        return $scope.model.readSettings.binCount;
 *    } else {
 *        return 100; // default value.
 *    }
 * OR
 *    if($scope){
 *        $scope.model = $scope.model || {};
 *        $scope.model.readSettings = $scope.model.readSettings || {};
 *        $scope.model.readSettings.binCount = 500;
 *    }
 */

// Why you should NOT use it...
/**
 * It's better to use optional chaining in many cases.
 * @ref https://www.typescriptlang.org/docs/handbook/release-notes/typescript-3-7.html
 *
 * Specifically, use optional chaining when we only want to get a deeply nested value
 * and want 'undefined' to be the fallback or default value to return when the value
 * doesn't exist, or some member in the path is missing.
 *
 * Why is optional chaining better than getFrom?...
 * Because the IDE and compiler can figure out what we're doing.
 * This means it can properly track member usage and properly infer types. Usually...
 * When using getFrom, the IDE has no clue what we are doing.
 * So:
 *  - Refactoring is easy since the IDE can help with renames and such. getFrom makes refactor scary risky.
 *  - The IDE can properly find usages. Making analyzing the code easier because I can jump definition and such.
 *  - The IDE doesn't consider path strings usage, so we can get improper warnings about 'Unused property'.
 *  - The IDE can usually do a better job of type safety since it better understands the objects we're using.
 * Another time when you shouldn't use getFrom is when we don't want to calculate the fallback value if we don't
 * have to. We can better use Nullish Coalescing with optional chaining for this.
 *  - this:  const x = $scope?.model?.readSettings?.binCount ?? calculateDefault();
 *  - NOT: const x = getFrom($scope, 'model.readSettings.binCount', calculateDefault())
 */

// OK, then why in the world should I EVER use it?
/**
 * A few reasons:
 *  - No more arguing with the stupid compiler over "TS2339: Property 'x' does not exist on type '{}'."
 *    The typescript compiler is great usually, but it can get confused. Especially when dealing with
 *    objects we got from some js library that didn't properly define their type definitions.
 *  - Allows for a default return when the property doesn't exist or a member on the path is undefined.
 *  - Allows for some type casting of the return value when a defaultValue is set.
 *  - Reduces the number of code paths that must be tested when using a defaultValue.
 *  - Can be easier to read, and optional chaining can get ugly fast. for example:
 *      - this: getFrom(jobs, `${i}.getStatus().code`, 404)
 *      - versus: jobs?.[i]?.getStatus?.()?.code ?? 404
 *  - Can be useful when building up dynamic objects of dynamic data.
 *
 */

// loosely Inspired by:
//    Dojo, which is Copyright (c) 2005-2009, The Dojo Foundation.
//    http://dojotoolkit.org/reference-guide/1.7/dojo/getObject.html
// and
//    jQuery getObject - v1.1 - 12/24/2009, Copyright (c) 2009 "Cowboy" Ben Alman
//    Project Home - http://benalman.com/projects/jquery-getobject-plugin/
//    Unit Tests      - http://benalman.com/code/projects/jquery-getobject/unit/


'use strict';



import {castToMatch} from './castToMatch';

/**
 * Gets a deeply nested object value.
 *
 * usage:
 * > getFrom($scope, 'model.readSettings.binCount'); // returns null if broken by null, undefined if broken by undefined.;
 * > getFrom($scope, 'model.readSettings.binCount', 100); // returns 100 if binCount doesn't exist;
 * @param context    Context in which to start walking path.
 * @param path       Dot-delimited string or array with nested property names.
 * @param defaultValue   Value to return if not found.
 * @returns          Value requested if found, undefined if unable to fully traverse path.
 */
export const getFrom = <T extends unknown>(context: any, path: string | string[], defaultValue?: T): T => {
  let p: any;
  let ret: any;

  if (typeof path === 'string') {
    path = path.split('.');
  } else if (Object.prototype.toString.call(path) !== '[object Array]') {
    return defaultValue as T;
  }

  ret = context;
  // we will continue to drill down with other falsy values like 0, false, ''
  while (ret !== undefined && ret !== null && path.length) {
    p = path.shift();
    if (p && p.indexOf('()', p.length - 2) !== -1) {
      p = p.substring(0, p.length - 2);
      if (ret[p]) {
        ret = ret[p]();
      } else {
        return defaultValue as T;
      }
    } else if (ret[p] === undefined) {
      return defaultValue as T;
    } else {
      ret = ret[p];
    }
  }

  if (path.length || ret === null || ret === undefined) {
    return defaultValue as T; // there was more path left to process!
  }

  if (defaultValue === undefined) {
    return ret as T; // We don't have any casting to do, return what we have.
  }

  return castToMatch(ret, defaultValue);
};
