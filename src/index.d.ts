declare type Document = object;

export declare function resolve(document: Document, uri?: string): Document;
export declare class Resolver
{
	public add(document: Document, uri?: string): void;
	public delete(uri: string): boolean;
	public get(uri: string, root?: Document): Document;
	public resolve(document: Document, uri?: string): Document;
}
