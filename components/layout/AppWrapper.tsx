"use client";

import { ThemeSync } from "@/components/providers/ThemeSync";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import { type ReactNode } from "react";
import { Header } from "./Header";

dayjs.extend(duration);

export const AppWrapper = ({ children }: Readonly<{ children: ReactNode }>) => {
  return (
    <div className="flex min-h-dvh flex-col">
      <ThemeSync />
      <Header />
      {children}
    </div>
  );
};
