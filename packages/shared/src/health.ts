/**
 * Trivial liveness signal used as the project's end-to-end toolchain smoke test
 * (TypeScript build + Vitest). Later phases replace this with real shared schemas.
 */
export function health(): "ok" {
  return "ok";
}
