declare const process: any;

const nextConfig = {
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
		// Temporarily ignore ESLint errors during build
		ignoreDuringBuilds: true,
	},
	typescript: {
		// Temporarily ignore TypeScript errors during build
		ignoreBuildErrors: true,
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
};

if (process.env.NEXT_OUTPUT === "standalone") {
	(nextConfig as any).output = "standalone";
}

export default nextConfig;
