import * as Restify from "restify";
import { checkStageServerStatus } from "../../routers/theaterRouter";
import { Show } from "../../models/Show";
import { generateUrlSlug } from "../../../shared/utils/urlUtils";
import { getShowSocialTemplate } from "./_showSocialTemplate";

/**
 * Add middleware to serve sharable show pages with slug-based routing
 * @param server - The Restify server instance
 */
export async function serveSharableShows(server: Restify.Server): Promise<void> {
	const findMatchingShowAndRespond = async (res: Restify.Response, next: Restify.Next, slug: string, path: string = "/"): Promise<void> => {
		try {
			// Find show by matching the path against the slug
			const shows = await Show.findAll();
			const matchingShow = shows.find((show) => {
				const generatedSlug = generateUrlSlug({ id: show.id, name: show.name });
				return generatedSlug === slug;
			});

			if (matchingShow) {
				// Check if stage server is running
				const stageStatus = await checkStageServerStatus();
				const isRunning = !stageStatus?.isEnded && stageStatus?.backstageConfiguration?.showId == matchingShow.id;

				if (isRunning) {
					// Redirect to the stage server URL
					const stageUrl = new URL(CONFIG.ipc.stageUrl);
					stageUrl.pathname = path ? `/${path}` : `/`;
					res.redirect(301, stageUrl.toString(), next);
					return next();
				} else {
					// Stage server not running, serve optimized HTML for SSO/social sharing
					// Always use root path for social sharing template
					const html = getShowSocialTemplate(matchingShow, slug);
					res.writeHead(200, {
						"Content-Length": Buffer.byteLength(html),
						"Content-Type": "text/html; charset=utf-8",
					});
					res.write(html);
					res.end();
					return next();
				}
			}
		} catch (error) {
			console.error("[Server] Error in sharable show middleware:", error);
			return next();
		}
	};

	server.get(
		"/f/*",
		(req, res, next) => {
			// The prefix f is for "föreställning"
			//
			// Extract slug from URL path (remove leading/trailing slashes)
			// Support paths like /f/show-slug and /f/show-slug/backstage
			const pathParts = (req.url?.replace(/^\/|\/$/g, "") || "").split("/");
			const slug = pathParts[1] || ""; // The show slug is always the second part
			const path = pathParts.slice(2).join("/"); // Preserve any suffix like "backstage"

			if (!slug) {
				return next();
			}
			return findMatchingShowAndRespond(res, next, slug, path);
		},
		(req, res, next) => {
			if (!res.headersSent) {
				res.redirect(302, "/notfound", next);
			}
		},
	);
}
