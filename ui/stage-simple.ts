/**
 * Entry point for simplified stage demo
 * Demonstrates the new event-driven room manager API
 */
import SimpleStage from "./components/stage/SimpleStage.svelte";

// Initialize the application
const app = new SimpleStage({
	target: document.getElementById("app")!,
});

export default app;
