<script lang="ts">
	import type { Scene } from "~/types/serverSideTypes";

	export let layout: Scene;
	export let size: "small" | "medium" | "large" = "small";

	// Calculate grid dimensions
	$: gridCols = layout.layout && layout.layout.length > 0 ? layout.layout[0].length : 1;
	$: gridRows = layout.layout && layout.layout.length > 0 ? layout.layout.length : 1;

	// Size configurations
	$: sizeConfig = {
		small: { width: 48, height: 32, cellGap: 2, cornerRadius: 2 },
		medium: { width: 80, height: 54, cellGap: 3, cornerRadius: 3 },
		large: { width: 120, height: 80, cellGap: 4, cornerRadius: 4 },
	}[size];

	// Calculate cell dimensions
	$: cellWidth = (sizeConfig.width - (gridCols - 1) * sizeConfig.cellGap) / gridCols;
	$: cellHeight = (sizeConfig.height - (gridRows - 1) * sizeConfig.cellGap) / gridRows;

	function getCellColor(cellType: string): string {
		switch (cellType) {
			case "actor":
				return "#0203fe"; // Custom primary blue
			case "chat":
				return "#fd584d"; // Custom info red
			case "empty":
				return "#e8e8e8"; // Better contrast grey
			default:
				return "#e8e8e8";
		}
	}

	function getCellStroke(cellType: string): string {
		switch (cellType) {
			case "actor":
				return "#0001cc"; // Darker primary
			case "chat":
				return "#e54136"; // Darker info red
			case "empty":
				return "#bfbfbf"; // Darker stroke for empty cells
			default:
				return "#bfbfbf";
		}
	}

	function getCellIcon(cellType: string): string {
		switch (cellType) {
			case "actor":
				return "👤";
			case "chat":
				return "💬";
			case "empty":
				return "";
			default:
				return "";
		}
	}
</script>

<div class="layout-preview layout-preview-{size}">
	{#if layout.layout && layout.layout.length > 0}
		<svg width={sizeConfig.width} height={sizeConfig.height} viewBox="0 0 {sizeConfig.width} {sizeConfig.height}" class="layout-svg">
			{#each layout.layout as row, rowIndex (rowIndex)}
				{#each row as cell, cellIndex (`${rowIndex}-${cellIndex}`)}
					{@const x = cellIndex * (cellWidth + sizeConfig.cellGap)}
					{@const y = rowIndex * (cellHeight + sizeConfig.cellGap)}

					<!-- Cell background -->
					<rect
						{x}
						{y}
						width={cellWidth}
						height={cellHeight}
						rx={sizeConfig.cornerRadius}
						ry={sizeConfig.cornerRadius}
						fill={getCellColor(cell.type)}
						stroke={getCellStroke(cell.type)}
						stroke-width="0.5"
					/>

					<!-- Cell icon (for larger sizes) -->
					{#if size !== "small" && getCellIcon(cell.type)}
						<text
							x={x + cellWidth / 2}
							y={y + cellHeight / 2 + 1}
							text-anchor="middle"
							dominant-baseline="middle"
							font-size={size === "medium" ? "7" : "10"}
							fill="rgba(255,255,255,0.9)"
							font-weight="bold"
						>
							{getCellIcon(cell.type)}
						</text>
					{/if}
				{/each}
			{/each}
		</svg>
	{:else}
		<!-- Auto layout indicator -->
		<div class="auto-layout-preview">
			<svg width={sizeConfig.width} height={sizeConfig.height} viewBox="0 0 {sizeConfig.width} {sizeConfig.height}" class="layout-svg">
				<!-- Dashed border to indicate automatic -->
				<rect
					x="2"
					y="2"
					width={sizeConfig.width - 4}
					height={sizeConfig.height - 4}
					rx={sizeConfig.cornerRadius}
					ry={sizeConfig.cornerRadius}
					fill="none"
					stroke="#909090"
					stroke-width="1"
					stroke-dasharray="3,2"
				/>

				<!-- Auto icon -->
				{#if size !== "small"}
					<text
						x={sizeConfig.width / 2}
						y={sizeConfig.height / 2 + 2}
						text-anchor="middle"
						dominant-baseline="middle"
						font-size={size === "medium" ? "10" : "14"}
						fill="#909090"
					>
						🤖
					</text>
				{/if}
			</svg>
		</div>
	{/if}
</div>

<style lang="scss">
	.layout-preview {
		display: flex;
		align-items: center;
		justify-content: center;

		&-small {
			min-width: 48px;
			min-height: 32px;
		}

		&-medium {
			min-width: 80px;
			min-height: 54px;
		}

		&-large {
			min-width: 120px;
			min-height: 80px;
		}
	}

	.layout-svg {
		filter: drop-shadow(0 1px 3px rgba(0, 0, 0, 0.12));
		transition: all 0.2s ease;
		border-radius: 4px;
	}

	.auto-layout-preview {
		opacity: 0.8;
	}

	// Add subtle animation when hovering the parent
	:global(.scene-control:hover) .layout-svg {
		filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.18));
		transform: scale(1.02);
	}

	// Selected state enhancement
	:global(.scene-control.is-selected) .layout-svg {
		filter: drop-shadow(0 2px 8px rgba(2, 3, 254, 0.3));
	}
</style>
