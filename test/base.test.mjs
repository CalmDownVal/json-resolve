/* eslint-env mocha */
import { deepStrictEqual } from 'assert';
import { resolve, Resolver } from '../src/index.mjs';

describe('simple tests from readme', () =>
{
	it('basic resolution', () =>
	{
		const object =
		{
			maths :
			{
				operation : 'add',
				number1 : { $ref : '#/constants/foo' },
				number2 : { $ref : '#/constants/bar' }
			},
			constants :
			{
				foo : 123,
				bar : 42
			}
		};

		const expected =
		{
			maths :
			{
				operation : 'add',
				number1 : 123,
				number2 : 42
			},
			constants :
			{
				foo : 123,
				bar : 42
			}
		};

		deepStrictEqual(resolve(object), expected);
	});

	it('cross-document URI resolution', () =>
	{
		const doc1 =
		{
			$id : 'constants.json',
			foo : 123,
			bar : 42
		};

		const doc2 =
		{
			add : '+',
			sub : '-'
		};

		const object =
		{
			$id : 'calc/simple.json',
			operation : { $ref: '../operations.json#/add' },
			number1 : { $ref: '../constants.json#/foo' },
			number2 : { $ref: '../constants.json#/bar' }
		};

		const expected =
		{
			$id : 'calc/simple.json',
			operation : '+',
			number1 : 123,
			number2 : 42
		};

		const resolver = new Resolver();
		resolver.add(doc1);
		resolver.add(doc2, 'operations.json'); // doc2 misses $id; we must provide URI

		deepStrictEqual(resolver.resolve(object), expected);
	});
});
