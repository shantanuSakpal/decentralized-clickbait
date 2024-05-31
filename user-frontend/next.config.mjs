/** @type {import('next').NextConfig} */
const CLOUDFRONT_URL = process.env.NEXT_PUBLIC_CLOUDFRONT_URL

const nextConfig = {
    //add Image url
    images: {
        domains: [
            CLOUDFRONT_URL
        ],
    },
};

export default nextConfig;
