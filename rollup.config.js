import nodeResolve from 'rollup-plugin-node-resolve';
import { eslint } from 'rollup-plugin-eslint';
import typescript from 'rollup-plugin-typescript2';

export default {
	input: './src/cellx-collections.ts',

	output: {
		file: './dist/cellx-collections.umd.js',
		format: 'umd',
		name: 'cellx-collections'
	},

	// prettier-ignore
	plugins: [
		nodeResolve({ browser: true }),
		eslint(),
		typescript({ clean: true })
	]
};
