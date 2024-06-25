import type { SingletonDocument } from "./_singleton";

/** The Prompt singleton document that exists as a singleton on the server */
export interface PromptDocument extends SingletonDocument {
	title : string;
	body : string;
	dark : boolean;
	important : boolean;
	visible : boolean;
}