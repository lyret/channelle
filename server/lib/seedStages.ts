import { Stage } from "../models/Stage";

/**
 * Sample stages for development and initial setup
 */
const SAMPLE_STAGES = [
	{
		name: "Main Stage",
		description: "The primary performance space for live theater experiences. Perfect for full productions and main events.",
		stagePassword: "",
	},
	{
		name: "Rehearsal Room",
		description: "Private space for practice sessions and preparation. Ideal for working through scenes before the main performance.",
		stagePassword: "rehearsal123",
	},
	{
		name: "Workshop Studio",
		description: "Interactive workshop space for creative collaboration and experimental performances.",
		stagePassword: "",
	},
	{
		name: "Intimate Theater",
		description: "Smaller, more personal performance space for intimate shows and readings.",
		stagePassword: "intimate456",
	},
	{
		name: "Black Box Theater",
		description: "Versatile experimental theater space with flexible staging arrangements for avant-garde performances.",
		stagePassword: "",
	},
];

/**
 * Seeds the database with initial stage data if no stages exist
 */
export async function seedStages(): Promise<void> {
	try {
		// Check if we already have stages in the database
		const existingStageCount = await Stage.count();

		if (existingStageCount > 0) {
			console.log(`[SeedStages] Database already contains ${existingStageCount} stages, skipping seed.`);
			return;
		}

		console.log("[SeedStages] Creating initial stage data...");

		// Create all sample stages
		const createdStages = await Stage.bulkCreate(SAMPLE_STAGES);

		console.log(`[SeedStages] Successfully created ${createdStages.length} stages:`);
		createdStages.forEach(stage => {
			const passwordStatus = stage.stagePassword ? "(password protected)" : "(public)";
			console.log(`  - ${stage.name} ${passwordStatus}`);
		});

	} catch (error) {
		console.error("[SeedStages] Error seeding stages:", error);
		throw error;
	}
}

/**
 * Clears all stages from the database (useful for testing)
 */
export async function clearStages(): Promise<void> {
	try {
		const deletedCount = await Stage.destroy({ where: {} });
		console.log(`[SeedStages] Cleared ${deletedCount} stages from database.`);
	} catch (error) {
		console.error("[SeedStages] Error clearing stages:", error);
		throw error;
	}
}

/**
 * Resets stages by clearing existing ones and reseeding
 */
export async function resetStages(): Promise<void> {
	try {
		console.log("[SeedStages] Resetting stage data...");
		await clearStages();
		await seedStages();
		console.log("[SeedStages] Stage data reset complete.");
	} catch (error) {
		console.error("[SeedStages] Error resetting stages:", error);
		throw error;
	}
}
