const RE_URI = /^(?:([^:/?#]+):)?(?:\/\/([^/?#]*))?([^?#]*)(?:\?([^#]*))?(?:#(.*))?$/;
const URI_SCHEME = 1;
const URI_AUTHORITY = 2;
const URI_PATH = 3;
const URI_QUERY = 4;
const URI_FRAGMENT = 5;

class URIError extends Error
{
	constructor(uri)
	{
		super(`Invalid URI '${uri}'.`);
	}
}

function merge(path, base = '')
{
	const segments = [];

	let index = 0;
	let anchor = 0;
	let endSlash = false;
	let char = null;

	// process base path if needed
	if (!path || path[0] !== '/')
	{
		const length = base.length;
		do
		{
			// '&& !path' -> we omit last segment when the path is not empty
			if ((index === length && !path) || (char = base[index]) === '/')
			{
				if (index !== anchor || (index === length && char === '/'))
				{
					const segment = base.slice(anchor, index);
					switch (segment)
					{
						case '..':
							segments.pop();
							break;

						case '.':
							break;

						default:
							segments.push(segment);
							break;
					}
				}

				anchor = index + 1;
			}
		}
		while (++index <= length);

		// reset vars
		index = anchor = 0;
		char = null;
	}

	// process path
	const length = path.length;
	do
	{
		if (index === length || (char = path[index]) === '/')
		{
			if (index !== anchor || (index === length && !endSlash && char === '/'))
			{
				const segment = path.slice(anchor, index);
				switch (segment)
				{
					case '..':
						segments.pop();
						// fall through

					case '.':
						endSlash = true;
						break;

					default:
						segments.push(segment);
						endSlash = false;
						break;
				}
			}

			anchor = index + 1;
		}
	}
	while (++index <= length);

	// finalize
	path = segments.join('/');
	if (endSlash)
	{
		path += '/';
	}

	return path;
}

/**
 * resolves a URI and returns the result in normalized form
 * @param {string} uri the URI to resolve
 * @param {string} base the base URI to resolve relative URIs against
 * @returns {string}
 */
export function resolveURI(uri, base)
{
	const mUri = RE_URI.exec(uri);
	if (!mUri)
	{
		throw new URIError(uri);
	}

	// absolute -> only normalize the path
	// relative -> merge
	if (mUri[URI_SCHEME])
	{
		mUri[URI_PATH] = merge(mUri[URI_PATH]);
	}
	else
	{
		const mBase = RE_URI.exec(base);
		if (!mBase)
		{
			throw new URIError(uri);
		}

		for (let i = 1; i <= 5; ++i)
		{
			// paths complicate things...
			const part = mUri[i];
			if (i === URI_PATH)
			{
				mUri[i] = merge(part, mBase[i]);
				if (part)
				{
					break;
				}
			}
			else
			{
				if (part)
				{
					break;
				}
				mUri[i] = mBase[i];
			}
		}
	}

	// get final scheme,
	let tmp = mUri[URI_SCHEME];
	uri = tmp ? tmp + ':' : '';

	// authority,
	tmp = mUri[URI_AUTHORITY];
	if (tmp)
	{
		uri += '//' + tmp;
		tmp = mUri[URI_PATH];
		if (tmp && tmp[0] !== '/')
		{
			uri += '/';
		}
	}

	// path,
	uri += mUri[URI_PATH];

	// query
	tmp = mUri[URI_QUERY];
	if (tmp)
	{
		uri += '?' + tmp;
	}

	// and fragment
	tmp = mUri[URI_FRAGMENT];
	if (tmp)
	{
		uri += '#' + tmp;
	}

	return uri;
}

/**
 * Splits a URI into an array of two strings. First is the URI stripped of any fragment data,
 * second contains fragment data without the initial `#` character and can be empty.
 * @param {string} uri the URI to split
 * @returns {string[]}
 */
export function splitFragment(uri)
{
	const index = uri.indexOf('#');
	return index === -1 ? [ uri, '' ] : [ uri.slice(0, index), uri.slice(index + 1) ];
}
