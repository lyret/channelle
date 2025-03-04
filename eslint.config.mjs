import EsLintJs from '@eslint/js';
import Stylistic from '@stylistic/eslint-plugin';
import EsLintSvelte from 'eslint-plugin-svelte';
import Globals from 'globals';
import TsLint from 'typescript-eslint';
import SvelteConfig from './svelte.config.mjs';

export default [
	/** Files to lint */
	{ files: ['**/*.{js,mjs,cjs,ts,svelte}'] },
	/** Globals */
	{ languageOptions: { globals: { ...Globals.browser, ...Globals.node } } },
	/** Javascript */
	EsLintJs.configs.recommended,
	/** Typescript */
	...TsLint.configs.recommended,
	/** Svelte */
	...EsLintSvelte.configs.recommended,
	{
		files: ['**/*.svelte', '**/*.svelte.js', '**/*.svelte.ts'],
		languageOptions: {
			parserOptions: {
				projectService: true,
				extraFileExtensions: ['.svelte'], // Add support for additional file extensions, such as .svelte
				parser: TsLint.parser,
				// We recommend importing and specifying svelte.config.js.
				// By doing so, some rules in eslint-plugin-svelte will automatically read the configuration and adjust their behavior accordingly.
				// While certain Svelte settings may be statically loaded from svelte.config.js even if you don’t specify it,
				// explicitly specifying it ensures better compatibility and functionality.
				svelteConfig: SvelteConfig,
			},
		},
	},
	/** Ignore build output */
	{ ignores: ['.dist/**/*'] },
	/**
   * Replace prettier rules when used as a formatter
   * @see: https://itnext.io/how-to-replace-prettier-by-eslint-rules-21574359e041
   * and https://eslint.style
   */
	{
		plugins: {
			'@stylistic': Stylistic
		},
		rules: {
			'@stylistic/max-len': ['warn', { code: 120, ignoreComments: true, ignoreUrls: true, ignoreStrings: true }],
			'@stylistic/indent': ['error', 'tab'],
			'@stylistic/no-mixed-spaces-and-tabs': ['error', 'smart-tabs'],
			'@stylistic/semi': ['error', 'always'],
			'@stylistic/quotes': ['error', 'single'],
			'@stylistic/object-curly-spacing': ['error', 'always'],
			'@stylistic/arrow-parens': ['error', 'always'],
			'@stylistic/linebreak-style': 0,
		},
	},
	/** Modify some common rules to less severity */
	{
		rules: {
			'no-unused-vars': 'warn',
			'prefer-const': ['error', { ignoreReadBeforeAssign: true }],
			'@typescript-eslint/no-explicit-any': 'off'
		},
	},
];
