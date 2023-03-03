import {
  castToMatch,
  definedOrDefault,
  existsOn,
  getFrom,
  orDefault, orEmptyArray,
  orEmptyString,
  orUndefined,
  setOn
} from './index';

describe('codeComplexityHelpers: ', () => {
  interface Some {
    name: string;
    value: string;
    u: any;
    n: any;
    nan: any;
    zero: number;
    empty: string;
    f: boolean;
    sArray: string[];
    nArray: number[];
    date: Date;
    bigInt: bigint;
    decimal: number;
  }
  let foo: any;
  let some: Some;
  let getSome: () => Some;

  // a value we frequently set.
  const blam = 'blam'; // BLAM!!!

  beforeEach(() => {
    some = {
      name: 'joe black',
      value: 'taxes',
      u: undefined,
      n: null,
      nan: NaN,
      zero: 0,
      empty: '',
      f: false,
      sArray: ['one', 'two'],
      nArray: [0, 1, 2],
      date: new Date('2023-02-25T16:56:47.359Z'),
      bigInt: 9007199254740999n,
      decimal: 33.333333333,
    };
    getSome = () => some;

    foo = {
      bar: {
        u: undefined,
        n: null,
        bin: {
          fuz: 42,
          fuzzy: '44'
        },
        getSome
      }
    };
  });

  // gets nested values on an object given a path and optional default return value.
  describe('getFrom ', () => {

    describe('Reasons I should NOT use getFrom', () => {

      it('When getting a simple nested value and undefined is the expected default value', async () => {
        // both ways properly get values
        expect(foo?.bar).toEqual(foo.bar);
        expect(foo?.bar).toEqual(getFrom(foo, 'bar'));

        // both ways properly get undefined when a path element is undefined or null.
        foo = undefined;
        expect(foo?.bar).toEqual(undefined);
        expect(foo?.bar).toEqual(getFrom(foo, 'bar'));
      });

      it('should not run expensive calculations to find fallback unless necessary, but DOES', async () => {
        const expensiveMethod = jest.fn().mockReturnValue(88888);
        // where value exists, we don't run the expensiveMethod function.
        const x = foo?.bar?.bin?.fuz ?? expensiveMethod();
        expect(x).toEqual(42);
        expect(expensiveMethod).toHaveBeenCalledTimes(0);
        // here we run the expensiveMethod function no matter what.
        const y = getFrom(foo, 'bar.bin.fuz', expensiveMethod());
        expect(y).toEqual(42);
        expect(expensiveMethod).toHaveBeenCalledTimes(1);

        foo.bar = undefined; // and when the value was missing undefined...
        const x1 = foo?.bar?.bin?.fuz ?? expensiveMethod();
        expect(x1).toEqual(88888);
        expect(expensiveMethod).toHaveBeenCalledTimes(2);

        const y1 = getFrom(foo, 'bar.bin.fuz', expensiveMethod());
        expect(y1).toEqual(88888);
        expect(expensiveMethod).toHaveBeenCalledTimes(3);
      });
    });


    // check normal value returns
    describe('basic usage, check normal value returns', () => {
      it('should find values on a given object with string path', () => {
        expect(getFrom(foo, 'bar')).toEqual(foo.bar);
        expect(getFrom(foo, 'bar.bin')).toEqual(foo.bar.bin);
        expect(getFrom(foo, 'bar.bin.fuz')).toEqual(foo.bar.bin.fuz);
      });
      // AND
      it('should find values on a given object with string[] path', () => {
        expect(getFrom(foo, ['bar'])).toEqual(foo.bar);
        expect(getFrom(foo, ['bar', 'bin'])).toEqual(foo.bar.bin);
        expect(getFrom(foo, ['bar', 'bin', 'fuz'])).toEqual(foo.bar.bin.fuz);
      });
      it('should get target data of various types', () => {
        expect(getFrom(foo, 'bar')).toEqual(foo.bar); // whole objects
        expect(getFrom(foo, 'bar.u')).toEqual(undefined); // undefined
        expect(getFrom(foo, 'bar.n')).toEqual(undefined); // null
        expect(getFrom(some, 'nan')).toEqual(some.nan); // NaN
        expect(getFrom(some, 'zero')).toEqual(some.zero); // number
        expect(getFrom(some, 'empty')).toEqual(some.empty); // empty string
        expect(getFrom(some, 'f')).toEqual(some.f); // boolean
        expect(getFrom(some, 'sArray')).toEqual(some.sArray); // string[]
        expect(getFrom(some, 'nArray')).toEqual(some.nArray); // number[]
        expect(getFrom(foo, 'bar.getSome')).toEqual(foo.bar.getSome); // function
      });
    });

    describe('more fun usages', () => {
      it('should have a purpose', () => {
        // write me a safe function that will get the binCount setting from
        //  scope.model.readSettings, if it is set, and return me a default
        //  value of say 50 if it's not set or if the code is running without
        //  scope or no model attached to scope, or if readSettings don't yet exist.
        type getBinCount = (scope: any, defaultValue: number) => number;

        // Keep in mind that if you write this function in your code, then
        //   when you write your tests, you will have to exercise all
        //   the nested code paths in the if conditional to get full coverage.
        //   Which is annoying because we only write it like this to bulletproof against
        //   exceptions.
        const uglyGetBinCountSettingOrDefault: getBinCount = (scope: any, defaultValue: number) =>
        {
          if (
            scope &&
            scope.model &&
            scope.model.readSettings &&
            'binCount' in scope.model.readSettings
          ) {
            return scope.model.readSettings.binCount;
          } else {
            return defaultValue;
          }
        };
        // There, simple. And since getFrom is well tested, you don't have to worry about
        //    testing all possible inputs. You know how it behaves.
        const getFromApproach: getBinCount = (scope: any, defaultValue: number) =>
          getFrom(scope, 'model.readSettings.binCount', defaultValue);

        const optionalChainingApproach: getBinCount = (scope: any, defaultValue: number) =>
          scope?.model?.readSettings?.binCount || defaultValue; // note that there is a second code path to test.

        const goodScopeModelSettings = {
          model: {
            readSettings: {
              binCount: 100
            }
          }
        };
        const noBinCount = {model: {readSettings: {}}};
        const noSettings = {model: {}};
        const noModel = {};
        const noScope = undefined;

        expect(uglyGetBinCountSettingOrDefault(goodScopeModelSettings, 50)).toBe(100);
        expect(getFromApproach(goodScopeModelSettings, 50)).toBe(100);
        expect(optionalChainingApproach(goodScopeModelSettings, 50)).toBe(100);

        expect(uglyGetBinCountSettingOrDefault(noBinCount, 50)).toBe(50);
        expect(getFromApproach(noBinCount, 50)).toBe(50);
        expect(optionalChainingApproach(noBinCount, 50)).toBe(50);

        expect(uglyGetBinCountSettingOrDefault(noSettings, 50)).toBe(50);
        expect(getFromApproach(noSettings, 50)).toBe(50);
        expect(optionalChainingApproach(noSettings, 50)).toBe(50);

        expect(uglyGetBinCountSettingOrDefault(noModel, 50)).toBe(50);
        expect(getFromApproach(noModel, 50)).toBe(50);
        expect(optionalChainingApproach(noModel, 50)).toBe(50);

        expect(uglyGetBinCountSettingOrDefault(noScope, 50)).toBe(50);
        expect(getFromApproach(noScope, 50)).toBe(50);
        expect(optionalChainingApproach(noScope, 50)).toBe(50);
      });

      // fun edge stuff
      it('should should find properties of an array', () => {
        const array = ['one', 'two'];
        expect(getFrom(array, 'length')).toEqual(array.length);
      });
      it('should execute functions without parameters', () => {
        expect(getFrom(foo, 'bar.getSome()')).toEqual(some);
        expect(getFrom(foo, 'bar.getSome()')).toEqual(foo.bar.getSome());
      });
      it('should should execute functions in the path', () => {
        expect(getFrom(foo, 'bar.getSome().name')).toEqual(some.name);
        expect(getFrom(foo, 'bar.getSome().value')).toEqual(some.value);
        // but not if the function doesn't exist.
        const ret = 'boom';
        expect(getFrom(foo, 'bar.notAFunction().name', ret)).toBe(ret);
        expect(getFrom(foo, 'bar.notAFunction().value')).toBeUndefined();
      });
      it('should get array element by index', () => {
        foo.bar.arr = ['test1', 'test2'];
        expect(getFrom(foo, 'bar.arr.0')).toEqual('test1');
        expect(getFrom(foo, 'bar.arr.1')).toEqual('test2');
        // but not like this.
        expect(getFrom(foo, 'bar.arr.2')).toBeUndefined();
        const ret = 'boom';
        expect(getFrom(foo, 'bar.arr.2', ret)).toBe(ret);
      });

      it('can chain nested function calls and array index access, etc.', () => {
        const jobWrapper = (state: any) => ({
          getStatus: () => state
        });
        expect(jobWrapper(4).getStatus()).toEqual(4);

        const goodJob = jobWrapper({code: 0, message: 'no issues'});
        const invalidJob = {}; // won't have a .getStatus() method!
        const badJob = jobWrapper({code: 23, message: 'failed startup'});

        const jobs = [goodJob, invalidJob, badJob]; // invalidJob would normally be an exception landmine!

        const codes = [];
        let code;
        // let's grab codes and flatten to valid elements at the same time.
        //    using array path notation. Make sure the elements are strings!
        for (let i = 0; i < jobs.length; i++) {
          code = getFrom(jobs, `${i}.getStatus().code`); // jobs[i].getStatus().code
          // or perhaps code = getFrom(jobs, [i.toString(), 'getStatus()', 'code']); // jobs[i].getStatus().code
          // or perhaps code = (jobs as any)?.[i]?.getStatus.?()?.code; // jobs[i].getStatus().code
          if (code !== undefined) {
            codes.push(code);
          }
        }
        expect(codes).toEqual([0, 23]); // chugged right past the invalid path.

        const messages = [];
        const invalidJobMessage = '!JOB MISSING!';
        // let's grab the messages and inject our own default message for invalid jobs.
        //     this time using template string literals.
        for (let i = 0; i < jobs.length; i++) {
          messages.push(
            getFrom(jobs, `${i}.getStatus().message`, invalidJobMessage)
          );
        }
        expect(messages).toEqual([
          'no issues',
          invalidJobMessage,
          'failed startup'
        ]);
      });
    });

    describe('type safety', () => {
      it('should not change the type when no default value is provided (not using generics)', async () => {
        expect(typeof getFrom(foo, 'bar')).toEqual('object');
        expect(typeof getFrom(foo, 'bar.u')).toEqual('undefined');
        expect(typeof getFrom(foo, 'bar.n')).toEqual('undefined');
        expect(typeof getFrom(foo, 'bar.getSome().nan')).toEqual('number'); // "Not-a-Number" is a "number"
        expect(typeof getFrom(foo, 'bar.getSome().zero')).toEqual('number');
        expect(typeof getFrom(foo, 'bar.bin.fuz')).toEqual('number');
        expect(typeof getFrom(foo, 'bar.bin.fuzzy')).toEqual('string');
        expect(typeof getFrom(foo, 'bar.getSome().empty')).toEqual('string');
        expect(typeof getFrom(foo, 'bar.getSome().f')).toEqual('boolean');
        expect(typeof getFrom(foo, 'bar.getSome().sArray')).toEqual('object');
        expect(typeof getFrom(foo, 'bar.getSome().date')).toEqual('object');
        expect(typeof getFrom(foo, 'bar.getSome().bigInt')).toEqual('bigint');
        expect(typeof getFrom(foo, 'bar.getSome')).toEqual('function');
        expect(Array.isArray(getFrom(foo, 'bar.getSome().nArray'))).toEqual(true);
      });

      it('should cast to number when given a default value that is of type number', async () => {
        // const fuzzy: string = '44';
        // expect(typeof (fuzzy as unknown as number)).toEqual('number');
        expect(typeof getFrom(foo, 'bar.bin.fuzzy', 0)).toEqual('number');
        expect(typeof getFrom(foo, 'bar.bin.fuzzy', NaN as number)).toEqual('number');
        expect(typeof getFrom(foo, 'bar.bin.fuzzy', NaN)).toEqual('number');
        expect(getFrom(foo, 'bar.bin.fuzzy', NaN)).toEqual(44);
      });

      it('should cast to string if default value is string', async () => {
        const ret = getFrom(foo, 'bar.bin.fuz', '');
        expect(typeof ret).toEqual('string');
        expect(ret).toEqual('42');
      });

      it('should cast to string if default value is boolean', async () => {
        const ret = getFrom(some, 'zero', true);
        expect(typeof ret).toEqual('boolean');
        expect(ret).toEqual(false);
      });

      it('should cast to string if default value is bigint', async () => {
        const fallback: bigint = 99999999999999999999n;
        const ret = getFrom(some, 'zero', fallback);
        expect(typeof ret).toEqual('bigint');
        expect(ret).toEqual(0n);
      });

    });

    describe('double check tricky falsy returns', () => {
      // double check tricky falsy returns
      it('should return original falsy end values, except null', () => {
        foo.bar.bin = false;
        expect(getFrom(foo, 'bar.bin')).toBe(false);
        expect(getFrom(getSome(), 'f')).toBe(false);
        foo.bar.bin = 0;
        expect(getFrom(foo, 'bar.bin')).toBe(0);
        expect(getFrom(getSome(), 'zero')).toBe(0);
        foo.bar.bin = '';
        expect(getFrom(foo, 'bar.bin')).toBe('');
        expect(getFrom(getSome(), 'empty')).toBe('');
        foo.bar.bin = NaN;
        expect(getFrom(foo, 'bar.bin')).toBeNaN();
        expect(getFrom(getSome(), 'nan')).toBeNaN();
      });
      it('should return default value when final value is null', async () => {
        foo.bar.bin = null;
        expect(getFrom(foo, 'bar.bin')).toBe(undefined);
        expect(getFrom(getSome(), 'n')).toBe(undefined);
        expect(getFrom(foo, 'bar.bin', 'test')).toBe('test');
        expect(getFrom(getSome(), 'n', 'test')).toBe('test');
      });
      it('should not die on falsy mid-path values', async () => {
        expect(getFrom(some, 'empty')).toEqual('');

        expect(some?.empty?.length).toEqual(0);
        expect(getFrom(some, 'empty.length')).toEqual(0);

        expect(some?.empty?.toLowerCase()).toEqual('');
        expect(getFrom(some, 'empty.toLowerCase()')).toEqual('');

        expect(some?.zero?.toFixed()).toEqual('0');
        expect(getFrom(some, 'zero.toFixed()')).toEqual('0');

        expect(some?.f?.toString().toUpperCase()).toEqual('FALSE');
        expect(getFrom(some, 'f.toString().toUpperCase()')).toEqual('FALSE');
      });
    });

    describe('returns defaultValue when', () => {
      // check return of specified default when path value is not found
      it('return default value when path is un-found or value is undefined', () => {
        const def = 'boom';
        expect(getFrom(foo, ['bar', 'boom'], def)).toBe(def); // <-- boom doesn't exist
        expect(getFrom(foo, ['bar', 'u'], def)).toBe(def); // <-- u exists but is undefined
        expect(getFrom(foo, 'bar.u.boom', def)).toBe(def); // <-- u is undefined, boom doesn't exist
        expect(getFrom(foo, 'bar.n.boom', def)).toBe(def); // <-- n is null, boom doesn't exist
        expect(
          getFrom((undefined as unknown), 'boom.boom', def)
        ).toBe(def); // <-- boom not on undefined
        expect(getFrom((null as unknown), 'boom.boom', def)).toBe(
          def
        ); // <-- boom not on null
        expect(getFrom(getSome, '()', def)).toBe(def); // <-- yea, not wired to do that
        expect(getFrom(getSome(), 'u', def)).toBe(def); // <-- u exists but is undefined
        expect(getFrom(getSome(), 'u.boom', def)).toBe(def); // <-- boom not on undefined
      });

      // check breaks in path
      it('should return undefined on values that do not exist', () => {
        expect(getFrom(foo, 'x')).toBeUndefined(); // <-- x not on foo
        expect(getFrom(foo, 'bar.zoo')).toBeUndefined(); // <-- zoo not on foo
        expect(getFrom(foo, 'bar.bin.zoo')).toBeUndefined(); // <-- zoo not on bin
        expect(getFrom(foo, 'bar.bin.fuz.zoo')).toBeUndefined(); // <-- zoo not on fuz
      });
      it('should return undefined if sub path value is null', () => {
        expect(getFrom(foo, 'bar.n.fuz.zoo')).toBeUndefined(); // <-- fuz not on null,
      });
      it('should return undefined if sub path value is explicitly undefined', () => {
        expect(getFrom(foo, 'bar.u.fuz.zoo')).toBeUndefined(); // <-- fuz not on undefined
      });
      it('should return undefined if sub path value is falsy', () => {
        foo.bar.bin = false;
        expect(getFrom(foo, 'bar.bin.zoo')).toBeUndefined();
        foo.bar.bin = 0;
        expect(getFrom(foo, 'bar.bin.zoo')).toBeUndefined();
        foo.bar.bin = '';
        expect(getFrom(foo, 'bar.bin.zoo')).toBeUndefined();
        foo.bar.bin = NaN;
        expect(getFrom(foo, 'bar.bin.zoo')).toBeUndefined();
      });

      // check other breaks
      it('should return undefined when context is not an object', () => {
        foo = 'someString';
        expect(getFrom(foo, 'a')).toBeUndefined(); // <-- a not on string foo
        foo = 42;
        expect(getFrom(foo, 'a')).toBeUndefined(); // <-- a not on number foo
        foo = [1, 2, 3];
        expect(getFrom(foo, 'a')).toBeUndefined(); // <-- a not on number[] foo
      });
      it('should return defaultValue if the path is not string or array', () => {
        expect(getFrom(foo, {} as string)).toBeUndefined();
        expect(getFrom(foo, {} as string, 'boom')).toBe('boom');
      });
    });

    describe('Some common mistakes when using getFrom', () => {
      // common mistakes.
      it('should show some common mistakes', () => {
        foo.bar.arr = ['test1', 'test2'];
        // can't use array index annotation like this...
        expect(getFrom(foo, 'bar.arr[1]')).toBeUndefined();
        // can't use comma delimited string in path like this...
        expect(getFrom(foo, 'bar,arr,1')).toBeUndefined();
        // do it like this...
        expect(getFrom(foo, 'bar.arr.1')).toEqual(foo.bar.arr[1]);
      });

      it('Trying to cast to number without providing a default value of type number ', async () => {
        // CANNOT determine this should be a number if no default value is given,
        //    or if the provided default value is not REALLY a number.
        expect(typeof getFrom<number>(foo, 'bar.bin.fuzzy', undefined as unknown as number)).not.toEqual('number');
      });


    });

  });

  describe('castToMatch', () => {
    it('should error on cast to bigint with object', async () => {
      expect(() => castToMatch({}, 0n)).toThrow();
    });

    it('should return original object when no cast is supported', async () => {
      const a = {p:43};
      expect(castToMatch(a, undefined)).toEqual(a);
    });
  });


  // sets nested values on an object given a path and value.
  describe('setOn ', () => {
    it('should provide a simple example', () => {
      const input: any = {};
      // will return the value set
      expect(setOn(input, 'name.first', 'joe')).toBe('joe');
      expect(setOn(input, 'name.last', 'black')).toBe('black');

      // will set the value on the nested path
      expect(input.name).toEqual({first: 'joe', last: 'black'});
    });

    it('should allow the path to be a string array', () => {
      let input: any = {};
      // will return the value set
      expect(setOn(input, ['name', 'first'], 'joe')).toBe('joe');
      expect(setOn(input, ['name', 'last'], 'black')).toBe('black');

      // will set the value on the nested path
      expect(input.name).toEqual({first: 'joe', last: 'black'});

      // but NOT a sparse string array.
      input = {}; // to reset.
      const badPath = ['a'];
      badPath[2] = 'b'; // note there is no string at path[1]
      expect(setOn(input, badPath, blam)).toEqual(undefined);

      // but BE WARNED!
      expect(input).not.toEqual({});

      // it builds out mid-path objects as it unfolds the path. so...
      expect(input).toEqual({
        a: {}
      });
      // even though we were unable to set the end path, the
      // context object may be modified in some cases.
    });

    it('should set a value on path from root context', () => {
      expect(setOn(foo, 'b.c.d', blam)).toEqual(blam);
      expect(foo.b.c.d).toEqual(blam);
      expect(setOn(foo, ['e', 'f', 'g'], blam)).toEqual(blam);
      expect(foo.e.f.g).toEqual(blam);
    });
    it('should set a value on path from nested context', () => {
      expect(setOn(foo.bar, 'b.c.d', blam)).toEqual(blam);
      expect(foo.bar.b.c.d).toEqual(blam);
      expect(setOn(foo.bar, ['e', 'f', 'g'], blam)).toEqual(blam);
      expect(foo.bar.e.f.g).toEqual(blam);
    });

    it('should overwrite existing value on given path', () => {
      expect(some.name).toBe('joe black'); // <-- given this.
      const newName = 'john doe';
      expect(setOn(some, 'name', newName)).toBe(newName);
      expect(some.name).toBe(newName);
    });

    it('should set a value on path when mid-path value is null', () => {
      expect(foo.bar.n).toBeNull(); // <-- given this.
      expect(setOn(foo, 'bar.n.b.c.d', blam)).toEqual(blam);
      expect(foo.bar.n.b.c.d).toEqual(blam);
      expect(foo.bar.n).toEqual({
        b: {
          c: {
            d: blam
          }
        }
      });
      foo.bar.n = null; // quick reset to null;
      expect(setOn(foo, ['bar', 'n', 'b', 'c', 'd'], blam)).toEqual(blam);
      expect(foo.bar.n.b.c.d).toEqual(blam);
    });
    it('should also set a path value when mid-path is undefined', () => {
      expect(foo.bar.u).toBeUndefined(); // <-- given this.
      expect(setOn(foo, 'bar.u.b.c.d', blam)).toEqual(blam);
      expect(foo.bar.u.b.c.d).toEqual(blam);
    });

    it('should not set the path value if path is not string or number', () => {
      // Although written for TypeScript, the function should handle
      //   JavaScript issues that may be encountered.

      // not with an object
      let badPath = ({} as unknown) as string;
      foo = {a: 42};
      expect(setOn({}, badPath, blam)).toEqual(undefined);
      expect(foo).toEqual({a: 42});

      // not with a number
      badPath = (42 as unknown) as string;
      expect(setOn(foo, badPath, blam)).toEqual(undefined);
      expect(foo).toEqual({a: 42});

      // not with a boolean
      badPath = (true as unknown) as string;
      expect(setOn(foo, badPath, blam)).toEqual(undefined);
      expect(foo).toEqual({a: 42});

      // not with a function
      badPath = ((() => 'boom') as unknown) as string;
      expect(setOn(foo, badPath, blam)).toEqual(undefined);
      expect(foo).toEqual({a: 42});
    });

    it('should not overwrite a non-object context', () => {
      // can't set on a number... cuz TypeScript!
      foo = 42;
      expect(setOn(foo, 'b.c', blam)).toEqual(undefined);
      expect(foo).toEqual(42);

      // can't set on a string... cuz TypeScript!
      foo = `can't touch this`;
      expect(setOn(foo, 'b.c', blam)).toEqual(undefined);
      expect(foo).toEqual(`can't touch this`);

      // can't set on a boolean... cuz TypeScript!
      foo = true; // < -- stupid lint restrictions! pfft!
      expect(setOn(foo, 'b.c', blam)).toEqual(undefined);
      expect(foo).toEqual(true);

      // can't set on a function... cuz TypeScript!
      const fnFoo = () => blam;
      foo = fnFoo;
      expect(setOn(foo, 'b.c', blam)).toEqual(undefined);
      expect(foo).toEqual(fnFoo);

      // AND you CAN'T on null... although it's assumed null isn't a value to preserve,
      //   setting the context to an object in the function scope wouldn't set it to
      //   an object in the calling scope, and so the work would be lost.
      foo = null;
      expect(setOn(foo, 'b.c', blam)).toEqual(undefined);
      expect(foo).toEqual(null);

      // AND you CAN on undefined... although it's assumed undefined isn't a value to preserve,
      //   setting the context to an object in the function scope wouldn't set it to
      //   an object in the calling scope, and so the work would be lost.
      foo = undefined;
      expect(setOn(foo, 'b.c', blam)).toEqual(undefined);
      expect(foo).toEqual(undefined);
    });

    it('should not overwrite a non-object sub path values', () => {
      // can't set on a number... cuz TypeScript!
      expect(typeof foo.bar.bin.fuz).toBe('number'); // < -- given this.
      expect(setOn(foo, 'bar.bin.fuz.zip', blam)).toEqual(undefined);
      expect(foo.bar.bin.fuz).toEqual(42);

      // can't set on a string... cuz TypeScript!
      foo.bar.bin.fuz = `can't touch this`;
      expect(typeof foo.bar.bin.fuz).toBe('string'); // < -- given this.
      expect(setOn(foo, 'bar.bin.fuz.zip', blam)).toEqual(undefined);
      expect(foo.bar.bin.fuz).toEqual(`can't touch this`);

      // can't set on a boolean... cuz TypeScript!
      foo.bar.bin.fuz = true;
      expect(typeof foo.bar.bin.fuz).toBe('boolean'); // < -- given this.
      expect(setOn(foo, 'bar.bin.fuz.zip', blam)).toEqual(undefined);
      expect(foo.bar.bin.fuz).toEqual(true);

      // can't set on a function... cuz TypeScript!
      const fnFoo = () => blam;
      foo.bar.bin.fuz = fnFoo;
      expect(typeof foo.bar.bin.fuz).toBe('function'); // < -- given this.
      expect(setOn(foo, 'bar.bin.fuz.zip', blam)).toEqual(undefined);
      expect(foo.bar.bin.fuz).toEqual(fnFoo);

      // BUT, you CAN set Null in the sub-path... because null is not assumed
      //    to be a preservable value, and because the calling code has access
      //    to the parent object, we replace the null with an empty object {}
      //    and carry on.
      foo.bar.bin.fuz = null;
      expect(foo.bar.bin.fuz).toBeNull(); // < -- given this.
      expect(setOn(foo, 'bar.bin.fuz.zip', blam)).toEqual(blam);
      expect(foo.bar.bin.fuz).toEqual({
        zip: blam
      });

      // AND, you CAN set undefined in the sub-path... because undefined is not assumed
      //    to be a preservable value, and because the calling code has access
      //    to the parent object, we replace the undefined with an empty object {}
      //    and carry on.
      foo.bar.bin.fuz = undefined;
      expect(foo.bar.bin.fuz).toBeUndefined(); // < -- given this.
      expect(setOn(foo, 'bar.bin.fuz.zip', blam)).toEqual(blam);
      expect(foo.bar.bin.fuz).toEqual({
        zip: blam
      });
    });
  });

  describe('existsOn', () => {
    it('should find first level paths', () => {
      expect(existsOn(foo, 'bar')).toBeTruthy();
      expect(existsOn(foo, 'bar.bin')).toBeTruthy();
      expect(existsOn(foo, 'bar.bin.fuz')).toBeTruthy();
    });
    it('should indicate invalid path', () => {
      expect(existsOn(foo, 'x')).toBeFalsy();
      expect(existsOn(foo, 'bar.zoo')).toBeFalsy();
      expect(existsOn(foo, 'bar.bin.zoo')).toBeFalsy();
      expect(existsOn(foo, 'bar.bin.fuz.zoo')).toBeFalsy();
    });

    it('should have a purpose', () => {
      // write me this predicate function that, given a scope, (or not), will tell me if
      //    binCount is set on scope.model.readSettings.
      type predicate = (scope: any) => boolean;

      // Keep in mind that if you write this function in your code, then
      //   when you write your tests, you will have to exercise all
      //   the nested code paths in the if conditional to get full coverage.
      //   Which is annoying because we only write it like this to bulletproof against
      //   exceptions.
      const uglyModelSettingsBinCountSpecifiedFunction: predicate = (
        scope: any
      ) => {
        if (scope && scope.model && scope.model.readSettings) {
          return 'binCount' in scope.model.readSettings;
        } else {
          return false;
        }
      };
      const betterModelSettingsBinCountSpecifiedFunction: predicate = (
        scope: any
      ) => existsOn(scope, 'model.readSettings.binCount');

      const goodScopeModelSettings = {
        model: {
          readSettings: {
            binCount: 100
          }
        }
      };
      const noBinCount = {model: {readSettings: {}}};
      const noSettings = {model: {}};
      const noModel = {};
      const noScope = undefined;

      expect(
        uglyModelSettingsBinCountSpecifiedFunction(
          goodScopeModelSettings
        )
      ).toBe(true);
      expect(
        betterModelSettingsBinCountSpecifiedFunction(
          goodScopeModelSettings
        )
      ).toBe(true);

      expect(uglyModelSettingsBinCountSpecifiedFunction(noBinCount)).toBe(
        false
      );
      expect(
        betterModelSettingsBinCountSpecifiedFunction(noBinCount)
      ).toBe(false);

      expect(uglyModelSettingsBinCountSpecifiedFunction(noSettings)).toBe(
        false
      );
      expect(
        betterModelSettingsBinCountSpecifiedFunction(noSettings)
      ).toBe(false);

      expect(uglyModelSettingsBinCountSpecifiedFunction(noModel)).toBe(
        false
      );
      expect(betterModelSettingsBinCountSpecifiedFunction(noModel)).toBe(
        false
      );

      expect(uglyModelSettingsBinCountSpecifiedFunction(noScope)).toBe(
        false
      );
      expect(betterModelSettingsBinCountSpecifiedFunction(noScope)).toBe(
        false
      );
    });
  });

  describe('definedOrDefault', () => {
    it('should return value when defined', async () => {
      expect(definedOrDefault(5, 42)).toEqual(5);
      expect(definedOrDefault(0, 42)).toEqual(0);
      expect(definedOrDefault(NaN, 42)).toEqual(NaN);
      expect(definedOrDefault('5', 'default')).toEqual('5');
      expect(definedOrDefault('', 'default')).toEqual('');
    });
    it('should cast based on default.', async () => {
      expect(definedOrDefault('5' as any, 42)).toEqual(5);
      expect(definedOrDefault(5 as any, 'default')).toEqual('5');
    });
    it('should return fallback when null or undefined', async () => {
      expect(definedOrDefault(null, 's')).toEqual('s');
      expect(definedOrDefault(undefined, 's')).toEqual('s');
      const obj: any = {};
      expect(definedOrDefault(obj.x, 's')).toEqual('s');
      expect(definedOrDefault(obj[0], 's')).toEqual('s');
    });
  });

  describe('orDefault', () => {
    it('should return value when truthy', async () => {
      expect(orDefault(5, 42)).toEqual(5);
      expect(orDefault('5', 'default')).toEqual('5');
      expect(orDefault('test', 'default')).toEqual('test');
    });
    it('should cast based on default.', async () => {
      expect(orDefault('5', 42)).toEqual(5);
      expect(orDefault(5, 'default')).toEqual('5');
    });
    it('should return fallback when falsy', async () => {
      expect(orDefault(null, 's')).toEqual('s');
      expect(orDefault(undefined, 's')).toEqual('s');
      const obj: any = {};
      expect(orDefault(obj.x, 's')).toEqual('s');
      expect(orDefault(obj[0], 's')).toEqual('s');
      expect(orDefault(0, 42)).toEqual(42);
      expect(orDefault(NaN, 42)).toEqual(42);
      expect(orDefault('', 'default')).toEqual('default');
    });
  });

  describe('orEmptyArray', () => {
    it('should return original array if is array', async () => {
      const a1: any = [];
      expect(orEmptyArray(a1)).toEqual(a1);
      expect(typeof orEmptyArray(a1)).toEqual(typeof a1);

      const a2: string[] = ['a', 'b'];
      const b2: string[] = orEmptyArray(a2);
      expect(b2).toEqual(a2);
      expect(typeof b2).toEqual(typeof a2);

      const a3: number[] = [5, 9];
      const b3: number[] = orEmptyArray(a3);
      expect(b3).toEqual(a3);
      expect(typeof b3).toEqual(typeof a3);
    });
    it('should return empty array if not array', async () => {
      expect(orEmptyArray(undefined)).toEqual([]);
      expect(orEmptyArray(null)).toEqual([]);
      expect(orEmptyArray(33)).toEqual([]);
      expect(orEmptyArray({})).toEqual([]);
    });
  });

  describe('orEmptyString', () => {
    it('should return value as string if truthy', async () => {
      expect(orEmptyString('test')).toEqual('test');
      expect(orEmptyString(42)).toEqual('42');
      const dte = new Date('2023-02-25T16:56:47.359Z');
      expect(orEmptyString(dte)).toEqual(dte.toString());
      expect(orEmptyString({})).toEqual('[object Object]');
      expect(orEmptyString([])).toEqual('');
      expect(orEmptyString(['test'])).toEqual('test');
    });
    it('should return empty string if falsy', async () => {
      expect(orEmptyString('')).toEqual('');
      expect(orEmptyString(false)).toEqual('');
      expect(orEmptyString(0)).toEqual('');
      expect(orEmptyString(NaN)).toEqual('');
      expect(orEmptyString(undefined)).toEqual('');
      expect(orEmptyString(null)).toEqual('');
    });
  });

  describe('orUndefined', () => {
    it('should return truthy values, but undefined for falsey values', () => {
      expect(orUndefined(true)).toEqual(true);
      expect(orUndefined(42)).toEqual(42);
      expect(orUndefined({})).toEqual({});
      expect(orUndefined('something')).toEqual('something');
      expect(orUndefined('')).toEqual(undefined);
      expect(orUndefined(undefined)).toEqual(undefined);
      expect(orUndefined(null)).toEqual(undefined);
      expect(orUndefined(false)).toEqual(undefined);
    });
  });

});
