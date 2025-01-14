const esbuild = require("esbuild");

const production = process.argv.includes('--production');
const watch = process.argv.includes('--watch');

/**
 * @type {import('esbuild').Plugin}
 */
const esbuildProblemMatcherPlugin = {
	name: 'esbuild-problem-matcher',

	setup(build) {
		build.onStart(() => {
			console.log('[watch] build started');
		});
		build.onEnd((result) => {
			result.errors.forEach(({ text, location }) => {
				console.error(`✘ [ERROR] ${text}`);
				console.error(`    ${location.file}:${location.line}:${location.column}:`);
			});
			console.log('[watch] build finished');
		});
	},
};

async function buildNodeExtension() {
	const ctx = await esbuild.context({
    entryPoints: ['src/extension.ts'],
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
    platform: 'node',
    outfile: 'dist/node/extension.js',
    external: ['vscode'],
    logLevel: 'silent',
    plugins: [esbuildProblemMatcherPlugin],
  })
  if (watch) {
    await ctx.watch()
  } else {
    await ctx.rebuild()
    await ctx.dispose()
  }
}

async function buildWebExtension() {
	const ctx = await esbuild.context({
		entryPoints: ['src/extension.ts'], // 通用入口文件
    bundle: true,
    format: 'cjs',
    minify: production,
    sourcemap: !production,
    sourcesContent: false,
		platform: 'browser',
		outfile: "dist/web/extension.js",
		external: ['vscode'],
		logLevel: 'silent',
		define: {
      global: 'globalThis',
    },
		plugins: [esbuildProblemMatcherPlugin]
	})
	if (watch) {
    await ctx.watch()
  } else {
    await ctx.rebuild()
    await ctx.dispose()
  }
}

async function main() {
	console.log('Building Node extension...')
	await buildNodeExtension()

	console.log('Building Web extension...')
	await buildWebExtension()
}

main().catch(e => {
	console.error(e);
	process.exit(1);
});
