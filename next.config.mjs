/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/website-demos/excellentzohocrm',
  async redirects() {
    return [
      {
        source: '/',
        destination: '/website-demos/excellentzohocrm/dashboard',
        basePath: false,
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
