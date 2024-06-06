/** @type {import('next').NextConfig} */

const nextConfig = {
    //add Image url
    images: {
        remotePatterns: [
            {
                protocol: "https",
                hostname: "**",
            },
        ],
    },

};

export default nextConfig;
