import type { Alias, Change, ProgramPaths, TextChange } from "~/types";
export declare const IMPORT_EXPORT_REGEX: RegExp;
export declare const ESM_IMPORT_EXPORT_REGEX: RegExp;
export declare const COMMONJS_IMPORT_EXPORT_REGEX: RegExp;
/**
 * Generate the alias path mapping changes to apply to the provide files.
 *
 * @param files The list of files to replace alias paths in.
 * @param aliases The path mapping configuration from tsconfig.
 * @param programPaths Program options.
 */
export declare function generateChanges(files: string[], aliases: Alias[], programPaths: Pick<ProgramPaths, "srcPath" | "outPath">): Change[];
/**
 * Read the file at the given path and return the text with aliased paths replaced.
 *
 * @param filePath The path to the file.
 * @param aliases The path mapping configuration from tsconfig.
 * @param programPaths Program options.
 */
export declare function replaceAliasPathsInFile(filePath: string, aliases: Alias[], programPaths: Pick<ProgramPaths, "srcPath" | "outPath">): {
    changed: boolean;
    text: string;
    changes: TextChange[];
};
/**
 * Convert an aliased path to a relative path.
 *
 * @param importSpecifier A import specifier as used in the source file
 * @param outputFile The location of the file that the aliased path was from.
 * @param aliases The path mapping configuration from tsconfig.
 * @param programPaths Program options.
 * @param esModule Whether the import will be resolved with ES module semantics or commonjs semantics
 */
export declare function aliasToRelativePath(importSpecifier: string, outputFile: string, aliases: Alias[], { srcPath, outPath }: Pick<ProgramPaths, "srcPath" | "outPath">, esModule?: boolean): {
    file: string;
    original: string;
    replacement?: string;
};
