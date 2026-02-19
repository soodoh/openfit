/* eslint-disable eslint-plugin-import(prefer-default-export), typescript-eslint(explicit-module-boundary-types) */
import { cx } from 'class-variance-authority';
import type { CxOptions } from 'class-variance-authority';
import { twMerge } from "tailwind-merge";

export function cn(...inputs: CxOptions) {
  return twMerge(cx(inputs));
}
