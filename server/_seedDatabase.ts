import { Show } from "./models/Show";

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

		if (CONFIG.runtime.production) {
			if (CONFIG.runtime.verbose) {
				console.log("[Database] Database in production. Aborting data seeding.");
			}
			return;
		}
		if (existingShowCount > 0) {
			if (CONFIG.runtime.verbose) {
				console.log(`[Database] Database already contains ${existingShowCount} shows, skipping seed.`);
			}
			return;
		}

		console.log("[Database] Creating initial show data...");

		// Create all sample shows
		const createdShows = await Show.bulkCreate(SAMPLE_SHOWS);

		console.log(`[Database] Successfully created ${createdShows.length} shows:`);
		createdShows.forEach((show) => {
			const passwordStatus = show.password ? "(password protected)" : "(public)";
			console.log(`  - ${show.name} ${passwordStatus}`);
		});
	} catch (error) {
		console.error("[Database] Error seeding shows:", error);
		throw error;
	}
}
