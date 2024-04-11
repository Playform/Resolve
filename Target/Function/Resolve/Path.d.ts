import type { ProgramOptions, ProgramPaths, TSConfig } from "~/types";
/**
 * Resolve paths provided to the program to absolute paths.
 */
export declare function resolvePaths(options: Pick<ProgramOptions, "out" | "project" | "src">, tsConfig: TSConfig): ProgramPaths;
