import * as Restify from "restify";
import * as Fs from "node:fs/promises";
import * as Path from "node:path";
import { NonActiveStageTemplateMiddleware } from "./_templateForNonActiveStage";

/**
 * Serves all static files from the build output folder along with the non-active-stage template
 */
export async function serveNonActiveTemplateOnly(server: Restify.Server): Promise<void> {
	server.get("/", NonActiveStageTemplateMiddleware);
	server.get("/stage", NonActiveStageTemplateMiddleware);
	server.get("/backstage", NonActiveStageTemplateMiddleware);
	server.get("/notfound", NonActiveStageTemplateMiddleware);
}
