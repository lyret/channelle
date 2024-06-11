const autoPreprocess = require('svelte-preprocess');

module.exports = {
	compilerOptions: {
		css: false
	},
    preprocess: autoPreprocess()
}