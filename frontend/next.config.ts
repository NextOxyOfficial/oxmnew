import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	images: {
		domains: ["localhost"],
		remotePatterns: [
			{
				protocol: "http",
				hostname: "localhost",
				port: "8000",
				pathname: "/media/**",
			},
		],
	},
	// Reduce hydration mismatch warnings in development
	experimental: {
		serverComponentsExternalPackages: [],
	},
	// Optimize for better hydration
	swcMinify: true,
	reactStrictMode: true,
};

export default nextConfig;
