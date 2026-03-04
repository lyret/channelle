//@ts-ignore
import slugg from "slugg";

/**
 * Generate a URL-safe slug from a show object
 * @param show - Partial show object containing at least name or id
 * @returns URL-safe slug with random string suffix, or "show-{id}" fallback if name is empty/missing
 */
export function generateUrlSlug(show: { id?: number; name?: string }): string {
	// If name is provided and not empty, use slugg to generate slug
	if (show.name && show.name.trim()) {
		const slug = slugg(show.name.trim());

		if (slug) {
			return slug;
		}
	}

	// Fallback: return "show-{id}" with random suffix if id is available, otherwise just "show" with random suffix
	const randomSuffix = generateRandomString();
	return show.id ? `show-${show.id}-${randomSuffix}` : `show-${randomSuffix}`;
}

/**
 * Generate a random string of specified length
 * @param length - Length of the random string
 * @returns Random alphanumeric string
 */
function generateRandomString(length: number = 4): string {
	const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}
	return result;
}
