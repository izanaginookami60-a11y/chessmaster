/**
 * Randomness helpers.
 *
 * Math.random() is an impure function, so React's purity lint forbids
 * calling it inside components/hooks. Wrapping it in a plain module
 * function keeps the call opaque to the compiler and makes the intent
 * (a probability check, a random pick) obvious at the call site.
 */

export function randomChance(probability: number): boolean {
  return Math.random() < probability;
}

export function pickRandom<T>(items: readonly T[]): T | undefined {
  if (items.length === 0) return undefined;
  return items[Math.floor(Math.random() * items.length)];
}

export function randomColor(): "white" | "black" {
  return Math.random() < 0.5 ? "white" : "black";
}
