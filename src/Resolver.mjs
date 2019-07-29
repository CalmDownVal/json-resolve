import equal from '@calmdownval/slow-deep-equal';
import { resolveURI, splitFragment } from './URI.mjs';
import { unrefPtr, unrefId } from './pointers.mjs';

function removeFragment(uri)
{
	const index = uri.lastIndexOf('#');
	return index === -1
		? uri
		: index === uri.length - 1
			? uri.slice(0, -1)
			: null;
}

export default class Resolver
{
	#store = new Map();

	add(document, uri)
	{
		if (!uri && document && typeof document.$id === 'string')
		{
			uri = document.$id;
		}

		if (!uri)
		{
			throw new Error('Could not identify the document, invalid uri or $id attribute.');
		}

		// remove a possible '#' at the end
		uri = removeFragment(uri);
		if (!uri)
		{
			throw new Error('Unexpected non-empty URI fragment in root $id.');
		}

		// Use `resolveURI` without the base argument to normalize paths.
		// It will also throw for relative URIs.
		uri = resolveURI(uri);

		// add the root itself
		this.#add(document, uri);

		// add any sub-documents
		this.#scanSubDocuments(document, uri);
	}

	delete(uri)
	{
		uri = removeFragment(uri);
		if (!uri)
		{
			return false;
		}

		return this.#store.delete(resolveURI(uri));
	}

	get(uri, root)
	{
		let [ baseURI, fragment ] = splitFragment(uri);
		let document;

		if (baseURI === '')
		{
			if (root === undefined)
			{
				throw new Error('Either the document URI or the root directly must be specified.');
			}
			document = root;
		}
		else
		{
			baseURI = resolveURI(baseURI);
			document = this.#store.get(baseURI);
			if (document === undefined)
			{
				throw new Error(`Could not find document '${baseURI}'.`);
			}
		}

		if (fragment !== '')
		{
			if (fragment[0] === '/')
			{
				document = unrefPtr(document, fragment);
			}
			else
			{
				document = unrefId(document, '#' + fragment);
			}

			if (document === undefined)
			{
				throw new Error(`Could not resolve pointer '#${fragment}'.`);
			}
		}

		return document;
	}

	resolve(document, uri)
	{
		if (!uri && document && typeof document.$id === 'string')
		{
			uri = document.$id;
		}

		if (uri)
		{
			// remove a possible '#' at the end
			uri = removeFragment(uri);
			if (!uri)
			{
				throw new Error('Unexpected non-empty URI fragment in root $id.');
			}

			// Use `resolveURI` without the base argument to normalize paths.
			// It will also throw for relative URIs.
			uri = resolveURI(uri);
		}
		else
		{
			uri = '';
		}

		// scan for references
		const temp = this.#resolveRefs(document, document, uri);

		// resolution only returns when a $ref is encountered and cloning is needed
		return temp === undefined ? document : temp;
	}

	// FUTURE: use private method syntax
	#add = (document, uri) =>
	{
		const previous = this.#store.get(uri);
		if (previous !== undefined && !equal(previous, document))
		{
			throw new Error(`Document '${uri}' was already added with a different structure.`);
		}
		this.#store.set(uri, document);
	};

	// FUTURE: use private method syntax
	#scanSubDocuments = (document, baseURI, __top = true) =>
	{
		if (document && typeof document === 'object')
		{
			if (!__top && document.$id && typeof document.$id === 'string')
			{
				const uri = removeFragment(document.$id);
				if (uri)
				{
					baseURI = resolveURI(uri, baseURI);
					this.#add(document, baseURI);
				}
			}

			if (Array.isArray(document))
			{
				const length = document.length;
				for (let i = 0; i < length; ++i)
				{
					this.#scanSubDocuments(document[i], baseURI, false);
				}
			}
			else
			{
				for (const key in document)
				{
					this.#scanSubDocuments(document[key], baseURI, false);
				}
			}
		}
	};

	// FUTURE: use private method syntax
	#resolveRefs = (root, document, baseURI, __top = true) =>
	{
		if (document && typeof document === 'object')
		{
			if (document.$ref && typeof document.$ref === 'string')
			{
				const uri = resolveURI(document.$ref, baseURI);
				return this.get(uri, root);
			}

			if (!__top && document.$id && typeof document.$id === 'string')
			{
				const uri = removeFragment(document.$id);
				if (uri)
				{
					const tmp = resolveURI(uri, baseURI);
					baseURI = tmp;
				}
			}

			let clone;
			let needsClone = false;
			if (Array.isArray(document))
			{
				const length = document.length;
				clone = new Array(length);
				for (let i = 0; i < length; ++i)
				{
					let item = document[i];
					const temp = this.#resolveRefs(root, item, baseURI, false);
					if (temp !== undefined)
					{
						item = temp;
						needsClone = true;
					}
					clone[i] = item;
				}
			}
			else
			{
				clone = {};
				for (const key in document)
				{
					let item = document[key];
					const temp = this.#resolveRefs(root, item, baseURI, false);
					if (temp !== undefined)
					{
						item = temp;
						needsClone = true;
					}
					clone[key] = item;
				}
			}

			if (needsClone)
			{
				return clone;
			}
		}
	};
}
