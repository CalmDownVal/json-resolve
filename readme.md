# JSON Resolver

**This module uses the ES modules and requires Node v8.15.0+. Please refer to
[Node's documentation](https://nodejs.org/api/esm.html#esm_enabling) to read
more on how to enable this functionality in your environment.**

URI-aware resolver module for JSON `$ref` references. More tests and some basic
performance checks are still a ToDo. Use at your own risk.

## Installation

```sh
npm install @calmdownval/json-resolve
```

## Features

- both absolute and relative pointers are available
- relative pointers support referencing of array indexes and object keys
- understands $id and resolves both relative and absolute URIs
- all inputs are treated as strictly immutable
- solves reference cycles
- includes tests

## Usage

You can either pass a structure to the `resolve` function and get a resolved
copy of it or create a `new Resolver` instance and traverse the object using its
methods. This is useful especially when dealing with multiple structures that
link to one another or when only interested in a select part of a large
structure. In either case the input structures will not be modified in any way,
ever.

```js
import { resolve } from '@calmdownval/json-resolve';

const object = {
  maths: {
    operation: 'add',
    number1: { $ref: '#/constants/foo' },
    number2: { $ref: '#/constants/bar' }
  },
  constants: {
    foo: 123,
    bar: 42
  }
};

const resolved = resolve(object);
```

`resolved` will now contain the following structure:

```js
{
  maths: {
    operation: 'add',
    number1: 123,
    number2: 42
  },
  constants: {
    foo: 123,
    bar: 42
  }
}
```

Using `Resolver` you can add multiple structures to solve complex cross-document
references.

```js
import { Resolver } from '@calmdownval/json-resolve';

const doc1 = {
  $id: 'constants.json',
  foo: 123,
  bar: 42
};

const doc2 = {
  add: '+',
  sub: '-'
};

const object = {
  $id: 'calc/simple.json',
  operation: { $ref: '../operations.json#/add' },
  number1: { $ref: '../constants.json#/foo' },
  number2: { $ref: '../constants.json#/bar' }
};

const resolver = new Resolver();
resolver.add(doc1);
resolver.add(doc2, 'operations.json'); // doc2 misses $id; provide its URI via args

const resolved = resolver.resolve(object);
```

`resolved` will now contain the following structure:

```js
{
  $id: 'calc/simple.json',
  operation: '+',
  number1: 123,
  number2: 42
}
```
