/**
 * Patches @tanstack/start-server-core to add missing Node.js package import
 * specifiers (#tanstack-router-entry, #tanstack-start-entry).
 *
 * These virtual imports are normally resolved by the TanStack Start Vite plugin
 * during builds. In Vitest browser mode, the dep optimizer (Rolldown) tries to
 * resolve them via the package.json "imports" field, which doesn't include them.
 *
 * This script adds stub entries pointing to an existing no-op module in the
 * package, so Rolldown can resolve them without errors.
 *
 * Run automatically via the "postinstall" script in package.json.
 */
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

// Find the start-server-core package.json.
// Bun hoists deps to the monorepo root and stores them in a versioned .bun/ dir.
// Search upward from this script's location to find node_modules.
// Find ALL versions of start-server-core package.json.
// Bun hoists deps to the monorepo root and may have multiple versions.
function findAllPackageJsons(): string[] {
	const results: string[] = [];
	let dir = resolve(import.meta.dirname, "..");
	for (let i = 0; i < 5; i++) {
		// Try standard node_modules path
		const standard = join(
			dir,
			"node_modules/@tanstack/start-server-core/package.json",
		);
		try {
			readFileSync(standard);
			results.push(standard);
		} catch {
			/* not here */
		}

		// Try Bun's .bun/ directory with versioned folders (may have multiple versions)
		const bunDir = join(dir, "node_modules/.bun");
		try {
			for (const entry of readdirSync(bunDir)) {
				if (entry.startsWith("@tanstack+start-server-core@")) {
					const candidate = join(
						bunDir,
						entry,
						"node_modules/@tanstack/start-server-core/package.json",
					);
					try {
						readFileSync(candidate);
						results.push(candidate);
					} catch {
						/* not this version */
					}
				}
			}
		} catch {
			/* no .bun dir here */
		}

		dir = resolve(dir, "..");
	}
	return results;
}

const pkgPaths = findAllPackageJsons();

if (pkgPaths.length === 0) {
	console.log(
		"[patch-tanstack-imports] @tanstack/start-server-core not found, skipping",
	);
	process.exit(0);
}

const stubPath = "./dist/esm/fake-start-server-fn-resolver.js";
let totalPatched = 0;

for (const pkgPath of pkgPaths) {
	const pkg = JSON.parse(readFileSync(pkgPath, "utf8"));
	const imports = pkg.imports ?? {};
	let patched = false;

	if (!imports["#tanstack-router-entry"]) {
		imports["#tanstack-router-entry"] = { default: stubPath };
		patched = true;
	}

	if (!imports["#tanstack-start-entry"]) {
		imports["#tanstack-start-entry"] = { default: stubPath };
		patched = true;
	}

	if (patched) {
		pkg.imports = imports;
		writeFileSync(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`);
		totalPatched++;
	}
}

if (totalPatched > 0) {
	console.log(
		`[patch-tanstack-imports] Patched ${totalPatched} @tanstack/start-server-core version(s)`,
	);
} else {
	console.log(
		`[patch-tanstack-imports] All ${pkgPaths.length} version(s) already patched`,
	);
}
