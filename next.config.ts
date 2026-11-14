import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [{ key: "X-Robots-Tag", value: "noindex" }],
      },
      {
        source: "/:gameId(chess|tic-tac-toe|carrom|paperwing|sudoku)/play",
        headers: [{ key: "Content-Security-Policy", value: "frame-ancestors 'self' https://vihar.online" }],
      },
    ];
  },
};

export default nextConfig;
