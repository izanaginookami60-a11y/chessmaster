import type { MetadataRoute } from "next";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

const STATIC_ROUTES = [
  "",
  "/play",
  "/play/computer",
  "/play/online",
  "/puzzles",
  "/puzzles/daily",
  "/puzzles/rush",
  "/puzzles/dashboard",
  "/learn",
  "/learn/articles",
  "/openings",
  "/analysis",
  "/analysis/editor",
  "/leaderboard",
  "/forums",
  "/clubs",
  "/tournaments",
  "/watch",
  "/login",
  "/register",
  "/settings",
];

export default function sitemap(): MetadataRoute.Sitemap {
  return STATIC_ROUTES.map((route) => ({
    url: `${APP_URL}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "daily" : "weekly",
    priority: route === "" ? 1 : 0.7,
  }));
}
