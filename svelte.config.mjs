import preprocess from 'svelte-preprocess';
import path, { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const filePath = dirname(fileURLToPath(import.meta.url));
const sassPath = `${filePath}/ui/styles/`;

export default {
	compilerOptions: {
		css: 'external',
	},
	preprocess: preprocess({
		scss: {
			prependData: `@charset 'UTF-8'; @use '${sassPath}_globalComponentMixins.scss' as *;`,
			silenceDeprecations: ['legacy-js-api'],
		},
	}),
};
