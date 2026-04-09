import "@testing-library/jest-dom/vitest";
import { mkdirSync } from "node:fs";

mkdirSync("./coverage/.tmp", { recursive: true });
const coverageTmpKeepalive = setInterval(() => {
	mkdirSync("./coverage/.tmp", { recursive: true });
}, 100);
coverageTmpKeepalive.unref();
