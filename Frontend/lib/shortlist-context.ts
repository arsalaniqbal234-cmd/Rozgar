"use client";
import { createContext } from "react";
import type { Job } from "./api";
import type { ShortlistedJob } from "./shortlist";

export type ShortlistState = {
  jobs: ShortlistedJob[]; ready: boolean; error: string | null;
  toggleJob: (job: Job) => string | null;
  removeJob: (id: number) => string | null;
  retry: () => unknown;
};
export const ShortlistContext = createContext<ShortlistState | null>(null);
