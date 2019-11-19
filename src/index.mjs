import { Resolver } from './Resolver.mjs';

/**
 * Scans a document and returns a clone with resolved $refs.
 * @param document the document to resolve
 * @param uri the URI of this document to use for resolution (can be omitted if $id is set)
 */
function resolve(document, uri)
{
	const resolver = new Resolver();
	return resolver.resolve(document, uri);
}

export { resolve, Resolver };
