/**
 * Generate the alias path mapping changes to apply to the provide files.
 *
 * @param files The list of files to replace alias paths in.
 * @param aliases The path mapping configuration from tsconfig.
 * @param programPaths Program options.
 */
export default (
	File: string[],
	Alias: Alias[],
	Path: Pick<ProgramPaths, "Source" | "Target">
): Change[] => {
	const changeList: Change[] = [];

	File.forEach((File) => {
		const {
			changed,
			text: Text,
			changes: Change,
		} = replaceAliasPathsInFile(File, Alias, Path);

		if (!changed) {
			return;
		}

		
		changeList.push({ File, Text, Change });
	});

	return changeList;
};

/**
 * Read the file at the given path and return the text with aliased paths replaced.
 *
 * @param filePath The path to the file.
 * @param aliases The path mapping configuration from tsconfig.
 * @param programPaths Program options.
 */
export function replaceAliasPathsInFile(
	filePath: string,
	aliases: Alias[],
	programPaths: Pick<ProgramPaths, "Source" | "Target">
): { changed: boolean; text: string; changes: TextChange[] } {
	if (!existsSync(filePath)) {
		throw new FileNotFound(replaceAliasPathsInFile.name, filePath);
	}

	const originalText = readFileSync(filePath, "utf-8");

	const changes: TextChange[] = [];

	const newText = originalText.replace(
		IMPORT_EXPORT_REGEX,
		(original, importStatement: string, importSpecifier: string) => {
			// The import is an esm import if it is inside a typescript (definition) file or if it uses `import` or `export`
			const esmImport =
				!filePath.endsWith(".ts") &&
				(importStatement.includes("import") ||
					importStatement.includes("export"));

			const result = aliasToRelativePath(
				importSpecifier,
				filePath,
				aliases,
				programPaths,
				esmImport
			);

			if (!result.replacement) {
				return original;
			}

			const index = original.lastIndexOf(importSpecifier);

			changes.push({
				Original: Normalize(result.original),
				Modify: Normalize(result.replacement),
			});

			return (
				original.substring(0, index) +
				result.replacement +
				original.substring(index + importSpecifier.length)
			);
		}
	);

	return { changed: originalText !== newText, text: newText, changes };
}

/**
 * Convert an aliased path to a relative path.
 *
 * @param importSpecifier A import specifier as used in the source file
 * @param outputFile The location of the file that the aliased path was from.
 * @param aliases The path mapping configuration from tsconfig.
 * @param programPaths Program options.
 * @param esModule Whether the import will be resolved with ES module semantics or commonjs semantics
 */
export function aliasToRelativePath(
	importSpecifier: string,
	outputFile: string,
	aliases: Alias[],
	{ Source, Target }: Pick<ProgramPaths, "Source" | "Target">,
	esModule?: boolean
): { file: string; original: string; replacement?: string } {
	const sourceFile = resolve(Source, relative(Target, outputFile));

	const sourceFileDirectory = dirname(sourceFile);

	const outputFileDirectory = dirname(outputFile);

	const importPathIsRelative =
		importSpecifier.startsWith("./") || importSpecifier.startsWith("../");

	const matchingAliases = aliases.filter(({ Prefix }) =>
		importSpecifier.startsWith(Prefix)
	);

	const absoluteImportPaths = importPathIsRelative
		? [resolve(sourceFileDirectory, importSpecifier)]
		: matchingAliases.flatMap(({ Prefix, Path }) =>
				Path.map((aliasPath) =>
					resolve(aliasPath, importSpecifier.replace(Prefix, ""))
				)
			);

	const absoluteImport = absoluteImportPaths.reduce<null | ReturnType<
		typeof resolveImportPath
	>>((acc, path) => acc || resolveImportPath(path), null);

	if (!absoluteImport) {
		return {
			file: outputFile,
			original: importSpecifier,
		};
	}

	const absoluteImportPath = esModule
		? absoluteImport.file
		: absoluteImport.imported;

	const relativeImportPath =
		absoluteImport.type === "file"
			? join(
					relative(sourceFileDirectory, dirname(absoluteImportPath)),
					basename(absoluteImportPath)
				)
			: relative(sourceFileDirectory, absoluteImportPath);

	const prefixedRelativePath = relativeImportPath.replace(
		/^(?!\.+\/)/,
		(m) => `./${m}`
	);

	const relativePathJsExtension = prefixedRelativePath.replace(
		/\.[^/.]*ts[^/.]*$/,
		(match) =>
			match
				.replace(/\.ts$/, ".js")
				.replace(/\.tsx$/, ".jsx")
				.replace(/\.mts$/, ".mjs")
				.replace(/\.cts$/, ".cjs")
	);

	const jsxFileExists = isFile(
		resolve(outputFileDirectory, relativePathJsExtension)
	);

	const relativePathJsxExtension = jsxFileExists
		? relativePathJsExtension
		: relativePathJsExtension.replace(/\.jsx$/, ".js");

	return {
		file: Normalize(outputFile),
		original: Normalize(importSpecifier),
		...(importSpecifier !== relativePathJsxExtension && {
			replacement: Normalize(relativePathJsxExtension),
		}),
	};
}

/**
 * Find the file that will be imported by the given import path.
 *
 * @param importPath An non-relative import path
 */
function resolveImportPath(importPath: string) {
	const importPathTs = importPath.replace(/\.[^/.]*js[^/.]*$/, (match) =>
		match.replace("js", "ts")
	);

	const importPathWithoutFileExtension = importPath.replace(
		/\.[^/.]*(js|json)[^/.]*$/,
		""
	);

	const importPathWithExtensions = MODULE_EXTS.map(
		(ext) => `${importPathWithoutFileExtension}${ext}`
	);

	const possiblePaths = [
		importPath,
		importPathTs,
		...importPathWithExtensions,
	];

	const existingPath = possiblePaths.find((path) => isFile(path));
	if (existingPath) {
		return {
			imported: importPath,
			file: existingPath,
			type: "file" as const,
		};
	}

	// Try index files if the path is a directory
	const possiblePathsAsDirectory = isDirectory(importPath)
		? MODULE_EXTS.map((ext) => `${importPath}/index${ext}`)
		: [];

	const existingIndexPath = possiblePathsAsDirectory.find((path) =>
		isFile(path)
	);

	if (existingIndexPath) {
		return {
			imported: importPath,
			file: existingIndexPath,
			type: "directory" as const,
		};
	}

	return null;
}

function isFile(path: string) {
	try {
		return statSync(path).isFile();
	} catch (e) {
		return false;
	}
}

function isDirectory(path: string) {
	try {
		return statSync(path).isDirectory();
	} catch (e) {
		return false;
	}
}

import { existsSync, readFileSync, statSync } from "fs";
import { basename, dirname, join, relative, resolve } from "path";

import FileNotFound from "@Class/Error/FileNotFound";
import Normalize from "@Function/Normalize";

import type Alias from "@Interface/Alias.js";
import type Change from "@Interface/Change.js";
import type ProgramPaths from "@Interface/ProgramPaths.js";
import type TextChange from "@Interface/TextChange.js";

export const IMPORT_EXPORT_REGEX =
	/((?:require\(|require\.resolve\(|import\()|(?:import|export)\s+(?:[\s\S]*?from\s+)?)['"]([^'"]*)['"]\)?/g;

export const ESM_IMPORT_EXPORT_REGEX =
	/(?:(?:import\()|(?:import|export)\s+(?:[\s\S]*?from\s+)?)['"]([^'"]*)['"]\)?/g;

export const COMMONJS_IMPORT_EXPORT_REGEX =
	/(?:(?:require\(|require\.resolve\()\s+)['"]([^'"]*)['"]\)/g;

const MODULE_EXTS = [
	".js",
	".jsx",
	".ts",
	".tsx",
	".cjs",
	".mjs",
	".mdx",
	".d.ts",
	".json",
];
