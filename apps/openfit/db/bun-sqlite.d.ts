declare module "bun:sqlite" {
	export class Database {
		constructor(filename: string, options?: unknown);
		exec(sql: string): this;
	}
}
