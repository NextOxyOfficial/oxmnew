import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		domains: ["localhost", "168.231.119.200"],
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
		],
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
};

export default nextConfig;
