export interface NextConfig {
  reactStrictMode: boolean;
  transpilePackages: string[];
}

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@atm/shared', '@atm/db'],
};

export default nextConfig;

