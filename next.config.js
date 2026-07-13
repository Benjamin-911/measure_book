const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  turbopack: {
    root: path.join(__dirname),
  },
  allowedDevOrigins: ['192.168.100.93'],
};

module.exports = nextConfig;
