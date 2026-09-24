import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/play",
          "/puzzles",
          "/learn",
          "/openings",
          "/clubs",
          "/forums",
          "/tournaments",
          "/watch",
          "/leaderboard",
        ],
        disallow: [
          "/messages",
          "/settings",
          "/play/online/",
          "/game/",
          "/analysis/",
          "/notifications",
        ],
      },
    ],
  };
}
