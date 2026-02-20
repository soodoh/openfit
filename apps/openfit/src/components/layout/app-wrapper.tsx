import { ThemeSync } from "@/components/providers/theme-sync";
import dayjs from "dayjs";
import duration from "dayjs/plugin/duration";
import type { ReactNode } from "react";
import { Header } from "./header";
dayjs.extend(duration);
export const AppWrapper = ({
  children,
}: Readonly<{
  children: ReactNode;
}>): any => {
  return (
    <div className="flex min-h-dvh flex-col">
      <ThemeSync />
      <Header />
      {children}
    </div>
  );
};

export default AppWrapper;
