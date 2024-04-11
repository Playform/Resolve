import type { TSConfig } from "~/types";
/**
 * Load the tsconfig file using Typescript's built-in config file loader.
 *
 * @param path The path to the tsconfig file.
 */
export declare function loadTSConfig(path: string): TSConfig;
