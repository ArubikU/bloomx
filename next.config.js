/** @type {import('next').NextConfig} */
const nextConfig = {
    env: {
        NEXT_PUBLIC_BRAND_NAME: process.env.BRAND_NAME,
        NEXT_PUBLIC_BRAND_COLOR: process.env.BRAND_COLOR,
        NEXT_PUBLIC_BRAND_LOGO: process.env.BRAND_LOGO,
    }
};

module.exports = nextConfig;
