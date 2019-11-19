declare type Document = object;

export declare function resolve(document: Document, uri?: string): Document;
export declare class Resolver
{
	public add(document: Document, uri?: string): void;
	public delete(uri: string): boolean;
	public get(uri: string, root?: Document): Document;
	public resolve(document: Document, uri?: string): Document;

	private addDocument(document: Document, uri: string): void;
	private scanSubDocuments(document: Document, baseURI: string, __top?: boolean): void;
	private resolveRefs(root: Document, document: Document, baseURI: string, __top?: boolean): Document | undefined;
}
