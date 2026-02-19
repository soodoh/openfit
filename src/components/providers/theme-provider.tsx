import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ComponentProps } from "react";
export function ThemeProvider({ children, ...props }: ComponentProps<typeof NextThemesProvider>): any {
    return <NextThemesProvider {...props}>{children}</NextThemesProvider>;
}

export default ThemeProvider;
