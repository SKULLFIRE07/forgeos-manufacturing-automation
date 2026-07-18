import type { NextConfig } from "next";

const [repositoryOwner = "", repositoryName = ""] = (
  process.env.GITHUB_REPOSITORY ?? ""
).split("/");
const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const isAccountPagesRepository =
  repositoryName.toLowerCase() === `${repositoryOwner.toLowerCase()}.github.io`;
const pagesBasePath =
  isGitHubActions && repositoryName && !isAccountPagesRepository
    ? `/${repositoryName}`
    : "";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["127.0.0.1"],
  assetPrefix: pagesBasePath,
  basePath: pagesBasePath,
  images: {
    unoptimized: true,
  },
  output: "export",
  reactStrictMode: true,
  trailingSlash: true,
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
