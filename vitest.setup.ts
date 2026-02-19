/* eslint-disable eslint-plugin-jest(no-hooks), eslint-plugin-jest(require-top-level-describe) */
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(() => cleanup());
