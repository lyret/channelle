//@ts-ignore
import slugg from "slugg";

/**
 * Generate a URL-safe slug from a show object
 * @param show - Partial show object containing at least name or id
 * @returns URL-safe slug, or "show-{id}" fallback if name is empty/missing
 */
export function generateUrlSlug(show: { id?: number; name?: string }): string {
	// If name is provided and not empty, use slugg to generate slug
	if (show.name && show.name.trim()) {
		const slug = slugg(show.name.trim());
		// If slugg produces a valid result, return it
		if (slug && slug !== "-") {
			return slug;
		}
	}

	// Fallback: return "show-{id}" if id is available, otherwise just "show"
	return show.id ? `show-${show.id}` : "show";
}
