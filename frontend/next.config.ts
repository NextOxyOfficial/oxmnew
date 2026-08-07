declare const process: any;

const nextConfig = {
	// A verification build must not overwrite the running dev server's `.next`:
	// `next build` writes production artifacts there, and the dev server then
	// fails with "Cannot find module './xxxx.js'" until it is restarted. Set
	// NEXT_DIST_DIR=.next-verify to build into a throwaway folder instead.
	distDir: process.env.NEXT_DIST_DIR || ".next",
	images: {
		domains: ["localhost", "168.231.119.200", "127.0.0.1", "oxymanager.com"],
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "8000",
				pathname: "/media/**",
			},
			{
				protocol: "http",
				hostname: "168.231.119.200",
				port: "8000",
				pathname: "/media/**",
			},
			{
				protocol: "https",
				hostname: "oxymanager.com",
				pathname: "/media/**",
			},
			{
				protocol: "http",
				hostname: "127.0.0.1",
				port: "8000",
				pathname: "/media/**",
			},
		],
		unoptimized: true, // This helps with development and some hosting issues
	},
	// Updated configuration for Next.js 15
	serverExternalPackages: [],
	reactStrictMode: true,
	eslint: {
		// Still skipped: the remaining findings are style-level (unused vars,
		// `any`), not correctness. Turn this on once they are cleaned up.
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Type errors now FAIL the build again. This was `true`, which let a
		// broken file ship silently — a page with a syntax/type error only
		// showed up as a blank screen at runtime.
		ignoreBuildErrors: false,
	},
	compiler: {
		// Strip debug logging from production bundles (the app carries ~340
		// console.log calls). `error` and `warn` are kept so real problems are
		// still reported; in dev everything logs as before.
		removeConsole:
			process.env.NODE_ENV === "production"
				? { exclude: ["error", "warn"] }
				: false,
	},
	// Add output configuration for better chunk handling
	// Configure webpack for better chunk loading
	webpack: (config: any, { isServer }: any) => {
		if (!isServer) {
			// Add retry logic for chunk loading
			config.output = {
				...config.output,
				crossOriginLoading: 'anonymous',
			};
		}
		return config;
	},
	output: "standalone",
};

export default nextConfig;
