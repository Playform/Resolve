import { ProgramOptions } from "~/types";
export type ResolveTsPathOptions = Omit<Partial<ProgramOptions>, "verbose" | "noEmit">;
/**
 * Convert Typescript path aliases to proper relative paths
 * in your transpiled JavaScript code.
 */
export declare function resolveTsPaths(options?: ResolveTsPathOptions): Promise<void>;
