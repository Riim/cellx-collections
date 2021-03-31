import { eslint } from 'rollup-plugin-eslint';
import typescript from 'rollup-plugin-typescript2';

export default {
	input: './src/cellx-collections.ts',
	external: ['cellx'],

	output: {
		file: './dist/cellx-collections.umd.js',
		format: 'umd',
		name: 'cellx-collections',
		globals: {
			cellx: 'cellx'
		}
	},

	// prettier-ignore
	plugins: [
		eslint(),
		typescript({ clean: true })
	]
};
