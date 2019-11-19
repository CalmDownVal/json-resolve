/* eslint-env mocha */
/* This is a test runner to support Node's native ES modules
 * with Mocha while they're still in experimental state.
 *
 * See this link for more info:
 * https://github.com/mochajs/mocha/issues/3006
 */

const glob = require('glob');

function globAsync(pattern)
{
	return new Promise((resolve, reject) =>
	{
		glob(pattern, (error, matches) =>
		{
			if (error)
			{
				reject(error);
				return;
			}
			resolve(matches);
		});
	});
}

(async () =>
{
	const matches = await globAsync('test/*.test.mjs');
	const imports = matches.map((match) => import('../' + match));

	await Promise.all(imports);
	run();
})();
