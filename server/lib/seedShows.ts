import { Show } from "../models/Show";

/**
 * Sample shows for development and initial setup
 */
const SAMPLE_SHOWS = [
	{
		name: "Hamlet - En klassisk tragedi",
		description: "En tidlös berättelse om hämnd, kärlek och makt i det danska kungahuset.",
		nomenclature: "föreställningen",
		showPassword: "",
	},
	{
		name: "Improvisationsworkshop",
		description: "En interaktiv workshop där deltagarna utforskar scenkonst genom improvisation.",
		nomenclature: "grejen",
		showPassword: "workshop123",
	},
	{
		name: "Litteraturföreläsning: Strindberg",
		description: "En djupgående föreläsning om August Strindbergs dramatik och dess betydelse för modern teater.",
		nomenclature: "föreläsningen",
		showPassword: "",
	},
	{
		name: "Experimentell performance",
		description: "En avantgardistisk performance som utforskar gränserna mellan teater, dans och multimedia.",
		nomenclature: "grejen",
		showPassword: "experiment456",
	},
	{
		name: "Barnteater: Pippi Långstrump",
		description: "En färgglad och rolig föreställning för hela familjen baserad på Astrid Lindgrens klassiska berättelser.",
		nomenclature: "föreställningen",
		showPassword: "",
	},
];

/**
 * Seeds the database with initial show data if no shows exist
 */
export async function seedShows(): Promise<void> {
	try {
		// Check if we already have shows in the database
		const existingShowCount = await Show.count();

		if (existingShowCount > 0) {
			console.log(`[SeedShows] Database already contains ${existingShowCount} shows, skipping seed.`);
			return;
		}

		console.log("[SeedShows] Creating initial show data...");

		// Create all sample shows
		const createdShows = await Show.bulkCreate(SAMPLE_SHOWS);

		console.log(`[SeedShows] Successfully created ${createdShows.length} shows:`);
		createdShows.forEach((show) => {
			const passwordStatus = show.showPassword ? "(password protected)" : "(public)";
			console.log(`  - ${show.name} ${passwordStatus}`);
		});
	} catch (error) {
		console.error("[SeedShows] Error seeding shows:", error);
		throw error;
	}
}

/**
 * Clears all shows from the database (useful for testing)
 */
export async function clearShows(): Promise<void> {
	try {
		const deletedCount = await Show.destroy({ where: {} });
		console.log(`[SeedShows] Cleared ${deletedCount} shows from database.`);
	} catch (error) {
		console.error("[SeedShows] Error clearing shows:", error);
		throw error;
	}
}

/**
 * Resets shows by clearing existing ones and reseeding
 */
export async function resetShows(): Promise<void> {
	try {
		console.log("[SeedShows] Resetting show data...");
		await clearShows();
		await seedShows();
		console.log("[SeedShows] Show data reset complete.");
	} catch (error) {
		console.error("[SeedShows] Error resetting shows:", error);
		throw error;
	}
}
