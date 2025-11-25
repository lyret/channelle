<script lang="ts">
	import { onMount, onDestroy } from "svelte";
	import { Editor, type Content } from "@tiptap/core";
	import { StarterKit } from "@tiptap/starter-kit";
	import { updateConfigurationSettings, showMetadataStore, showScriptStore } from "~/api/backstage/backstageClient";
	import IconSave from "../icons/Icon-save.svelte";
	import IconX from "../icons/Icon-x.svelte";
	import IconBold from "../icons/Icon-bold.svelte";
	import IconItalic from "../icons/Icon-italic.svelte";
	import IconUnderline from "../icons/Icon-underline.svelte";
	import IconList from "../icons/Icon-list.svelte";
	import { isTheaterAuthenticated, currentPeerStore } from "~/api";

	let element: HTMLElement;
	let editor: Editor | null = null;
	let initialContent: Content = "<p>Skriv ett manus här...</p>";
	let showingSuccessMessage = false;
	let showingExternalChangesWarning = false;
	let errorMessage = "";
	let isInitialized = false;
	let isLoading = false;
	$: hasChanges = isInitialized && (editor ? JSON.stringify(editor.getJSON()) !== JSON.stringify(initialContent) : false);
	$: canEdit = $currentPeerStore.manager || $isTheaterAuthenticated;
	$: canSave = hasChanges && !isLoading;

	onMount(() => {
		// Initialize Tiptap editor
		editor = new Editor({
			element: element,
			extensions: [StarterKit],
			content: initialContent,
			editorProps: {
				attributes: {
					class: "prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none",
				},
			},
			onFocus: () => {
				isInitialized = true;
			},
			onTransaction: () => {
				// Force re-render to update reactive variables
				editor = editor;
			},
		});

		// Subscribe to show changes to get script content
		const unsubscribe = showScriptStore.subscribe((scriptData) => {
			if (scriptData && editor) {
				let incommingContent;
				if (scriptData.script) {
					try {
						// Handle case where script is already parsed JSON or a JSON string
						incommingContent = typeof scriptData.script === "string" ? JSON.parse(scriptData.script) : scriptData.script;
					} catch (error) {
						console.warn("Failed to parse script JSON, using fallback:", error);
						incommingContent = null;
					}
				} else {
					incommingContent = null;
				}

				// Abort if we there are no changes in the content
				if (JSON.stringify(incommingContent) === JSON.stringify(initialContent)) {
					return;
				}

				// If we have local changes don't update the content in the editor, but warn the user about saving
				if (hasChanges) {
					showingExternalChangesWarning = true;
					return;
				}

				// Otherwise update the content in the editor
				try {
					editor.commands.setContent(incommingContent);
					initialContent = incommingContent;
				} catch (error) {
					console.warn("Failed to set editor content:", error);
				}
			}
		});

		return unsubscribe;
	});

	onDestroy(() => {
		editor?.destroy();
	});

	// Sets the displayed error message and clears after 8 seconds
	function setError(message: string) {
		errorMessage = message;
		setTimeout(() => {
			errorMessage = "";
		}, 8000);
	}

	function resetForm() {
		if (editor && initialContent) {
			errorMessage = "";
			showingSuccessMessage = false;
			showingExternalChangesWarning = false;
			editor.commands.setContent(initialContent);
		}
	}

	async function saveChanges() {
		if (!canSave || !editor) return;

		isLoading = true;
		errorMessage = "";
		showingSuccessMessage = false;

		try {
			const currentContent = editor.getJSON();

			// Save JSON content to script field
			const result = await updateConfigurationSettings({
				script: JSON.stringify(currentContent),
			});

			if (result.success) {
				initialContent = currentContent;
				showingSuccessMessage = true;
				showingExternalChangesWarning = false;

				// Clear success message after 3 seconds
				setTimeout(() => {
					showingSuccessMessage = false;
				}, 3000);
			} else {
				setError(result.error || "Okänt fel");
			}
		} catch (error) {
			console.error("Saving script failed:", error);
			setError("Ett oväntat fel uppstod. Försök igen.");
		} finally {
			isLoading = false;
		}
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === "Escape") {
			resetForm();
		}
		// Save with Ctrl/Cmd + S
		if ((event.ctrlKey || event.metaKey) && event.key === "s") {
			event.preventDefault();
			if (canSave) {
				saveChanges();
			}
		}
	}
</script>

<div class="script-instrument">
	<h1 class="title">
		{$showMetadataStore.nomenclature || "föreställningen"}s manus
	</h1>

	{#if showingExternalChangesWarning}
		<div class="notification is-warning">
			<p>✷ Någon annan har gjort ändringar sedan du började redigera... om du sparar nu kommer du skriva över deras ändringar.</p>
		</div>
	{/if}
	{#if showingSuccessMessage}
		<div class="notification is-success">
			<p>✓ Manuskriptet har uppdaterats</p>
		</div>
	{/if}

	{#if errorMessage}
		<div class="notification is-danger is-light">
			<p class="has-text-danger">✗ {errorMessage}</p>
		</div>
	{/if}

	<div class="editor-content">
		{#if editor && canEdit}
			<div class="editor-toolbar">
				<div class="button-group">
					<button
						class="button is-small"
						class:is-primary={editor.isActive("heading", { level: 1 })}
						on:click={() => editor?.chain().focus().toggleHeading({ level: 1 }).run()}
						title="Rubrik 1"
					>
						H1
					</button>
					<button
						class="button is-small"
						class:is-primary={editor.isActive("heading", { level: 2 })}
						on:click={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
						title="Rubrik 2"
					>
						H2
					</button>
					<button
						class="button is-small"
						class:is-primary={editor.isActive("heading", { level: 3 })}
						on:click={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
						title="Rubrik 3"
					>
						H3
					</button>
				</div>

				<div class="button-group">
					<button
						class="button is-small"
						class:is-primary={editor.isActive("bold")}
						on:click={() => editor?.chain().focus().toggleBold().run()}
						title="Fet text"
					>
						<span class="icon">
							<IconBold />
						</span>
					</button>
					<button
						class="button is-small"
						class:is-primary={editor.isActive("italic")}
						on:click={() => editor?.chain().focus().toggleItalic().run()}
						title="Kursiv text"
					>
						<span class="icon">
							<IconItalic />
						</span>
					</button>
					<button
						class="button is-small"
						class:is-primary={editor.isActive("strike")}
						on:click={() => editor?.chain().focus().toggleStrike().run()}
						title="Genomstruken text"
					>
						<span class="icon">
							<IconUnderline />
						</span>
					</button>
				</div>

				<div class="button-group">
					<button
						class="button is-small"
						class:is-primary={editor.isActive("bulletList")}
						on:click={() => editor?.chain().focus().toggleBulletList().run()}
						title="Punktlista"
					>
						<span class="icon">
							<IconList />
						</span>
					</button>
					<button
						class="button is-small"
						class:is-primary={editor.isActive("orderedList")}
						on:click={() => editor?.chain().focus().toggleOrderedList().run()}
						title="Numrerad lista"
					>
						1.
					</button>
				</div>

				<div class="button-group">
					<button
						class="button is-small"
						class:is-primary={editor.isActive("blockquote")}
						on:click={() => editor?.chain().focus().toggleBlockquote().run()}
						title="Citat"
					>
						"
					</button>
					<button
						class="button is-small"
						class:is-primary={editor.isActive("code")}
						on:click={() => editor?.chain().focus().toggleCode().run()}
						title="Kod"
					>
						&lt;&gt;
					</button>
				</div>
			</div>
		{/if}

		<div class="editor-wrapper" class:read-only={!canEdit}>
			<!-- svelte-ignore a11y-no-static-element-interactions -->
			<div bind:this={element} on:keydown={handleKeydown} class="editor"></div>
		</div>

		{#if canEdit}
			<div class="editor-actions">
				<div class="field is-grouped">
					<div class="control">
						<button class="button is-success" class:is-loading={isLoading} disabled={!canSave} on:click={saveChanges}>
							<span class="icon">
								<IconSave />
							</span>
							<span>Spara</span>
						</button>
					</div>
					<div class="control">
						<button class="button" disabled={!hasChanges || isLoading} on:click={resetForm}>
							<span class="icon">
								<IconX />
							</span>
							<span>Återställ</span>
						</button>
					</div>
				</div>
				<p class="help">Tryck Ctrl/Cmd + S för att spara snabbt</p>
			</div>
		{/if}
	</div>
</div>

<style lang="scss">
	.script-instrument {
		height: 100%;
		display: flex;
		flex-direction: column;
	}

	.editor-content {
		flex: 1;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}

	.notification {
		margin-bottom: 1rem;

		p {
			margin-bottom: 0;
		}
	}

	.editor-toolbar {
		display: flex;
		flex-wrap: wrap;
		gap: 0.5rem;
		margin-bottom: 1rem;
		padding: 0.75rem;
		background-color: var(--bulma-background);
		border: 1px solid var(--bulma-border);
		border-radius: 4px;

		.button-group {
			display: flex;
			gap: 0.25rem;
		}

		.button {
			border-radius: 4px;

			&.is-primary {
				background-color: var(--bulma-primary);
				border-color: var(--bulma-primary);
				color: var(--bulma-primary-invert);
			}
		}
	}

	.editor-wrapper {
		flex: 1;
		overflow-y: auto;
		border: 1px solid var(--bulma-border);
		border-radius: 4px;

		&.read-only {
			background-color: var(--bulma-background);
		}
	}

	.editor {
		min-height: 200px;
		padding: 1rem;
	}

	:global(.editor .ProseMirror) {
		outline: none;
		min-height: 160px;
	}

	:global(.editor .ProseMirror p) {
		margin-bottom: 1em;
	}

	:global(.editor .ProseMirror h1),
	:global(.editor .ProseMirror h2),
	:global(.editor .ProseMirror h3),
	:global(.editor .ProseMirror h4),
	:global(.editor .ProseMirror h5),
	:global(.editor .ProseMirror h6) {
		font-weight: bold;
		margin-bottom: 0.5em;
		margin-top: 1em;
	}

	:global(.editor .ProseMirror h1:first-child),
	:global(.editor .ProseMirror h2:first-child),
	:global(.editor .ProseMirror h3:first-child),
	:global(.editor .ProseMirror h4:first-child),
	:global(.editor .ProseMirror h5:first-child),
	:global(.editor .ProseMirror h6:first-child) {
		margin-top: 0;
	}

	:global(.editor .ProseMirror h1) {
		font-size: 2em;
	}

	:global(.editor .ProseMirror h2) {
		font-size: 1.5em;
	}

	:global(.editor .ProseMirror h3) {
		font-size: 1.25em;
	}

	:global(.editor .ProseMirror ul),
	:global(.editor .ProseMirror ol) {
		margin-bottom: 1em;
		padding-left: 1.5em;
	}

	:global(.editor .ProseMirror li) {
		margin-bottom: 0.25em;
	}

	:global(.editor .ProseMirror blockquote) {
		border-left: 3px solid var(--bulma-border);
		margin: 1em 0;
		padding-left: 1em;
		font-style: italic;
	}

	:global(.editor .ProseMirror code) {
		background-color: var(--bulma-background);
		border-radius: 3px;
		padding: 0.2em 0.4em;
		font-family: monospace;
		font-size: 0.9em;
	}

	:global(.editor .ProseMirror pre) {
		background-color: var(--bulma-background);
		border-radius: 4px;
		padding: 1em;
		overflow-x: auto;
		margin-bottom: 1em;
	}

	:global(.editor .ProseMirror pre code) {
		background: none;
		padding: 0;
	}

	:global(.editor .ProseMirror strong) {
		font-weight: bold;
	}

	:global(.editor .ProseMirror em) {
		font-style: italic;
	}

	:global(.editor .ProseMirror s) {
		text-decoration: line-through;
	}

	.editor-actions {
		margin-top: 1rem;
		padding-top: 1rem;
		border-top: 1px solid var(--bulma-border-weak);

		.field.is-grouped {
			margin-bottom: 0.5rem;
		}

		.help {
			font-size: 0.75rem;
			opacity: 0.8;
		}
	}

	// Responsive adjustments
	@media screen and (max-width: 768px) {
		.editor-toolbar {
			.button-group {
				.button {
					.icon {
						margin-right: 0;
					}

					span:not(.icon) {
						display: none;
					}
				}
			}
		}

		.editor-actions {
			.field.is-grouped {
				flex-direction: column;

				.control {
					width: 100%;

					.button {
						width: 100%;
					}
				}
			}
		}
	}
</style>
