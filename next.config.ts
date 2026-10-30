import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // The project folder is the root: a stray package-lock.json in a parent folder
  // (e.g. C:\Users\<you>) otherwise prints a warning on every start (Oct 29).
  turbopack: { root: process.cwd() },
  // The round "N" developer badge covered the footer and would show in the demo video.
  devIndicators: false,
};

export default nextConfig;
