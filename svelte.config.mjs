// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { dirname } from "node:path";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import { fileURLToPath } from "node:url";
import preprocess from "svelte-preprocess";

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
const filePath = dirname(fileURLToPath(import.meta.url));
const sassPath = `${filePath}/ui/styles/`;

export default {
	compilerOptions: {
		css: "external",
	},
	preprocess: preprocess({
		scss: {
			prependData: `@charset 'UTF-8'; @use '${sassPath}_globalComponentMixins.scss' as *;`,
			silenceDeprecations: ["legacy-js-api"],
		},
	}),
};
