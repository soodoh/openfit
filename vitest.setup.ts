import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { vi } from "vitest";

vi.afterEach(() => cleanup());
