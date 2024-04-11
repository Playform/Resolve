import type { Alias } from "~/types";
/**
 * Compute the alias paths provided by the tsconfig.
 */
export declare function computeAliases(basePath: string, paths: {
    [key: string]: string[];
}): Alias[];
