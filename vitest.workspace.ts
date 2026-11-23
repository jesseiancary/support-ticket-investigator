import { defineWorkspace } from "vitest/config";

// Each package is its own Vitest project so tests stay isolated per workspace
// package. New packages added under packages/* are picked up automatically.
export default defineWorkspace(["packages/*"]);
