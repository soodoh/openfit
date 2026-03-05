import { cx } from "class-variance-authority";
import type { CxOptions } from "class-variance-authority";
import { twMerge } from "tailwind-merge";
export function cn(...inputs: CxOptions): string {
  return twMerge(cx(inputs));
}

export default cn;
