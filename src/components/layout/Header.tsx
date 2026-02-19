import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { Image } from "@unpic/react";
import { Link } from "@tanstack/react-router";
import { AccountNavItem } from "./AccountNavItem";

const navItems = [
  { to: "/routines", label: "Routines" },
  { to: "/exercises", label: "Exercises" },
  { to: "/logs", label: "Logs" },
] as const;

export const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl)">
        <nav className="flex items-center py-4">
          <Link to="/">
            <Image
              src="/logo.svg"
              alt="OpenFit logo"
              width={40}
              height={40}
              layout="fixed"
            />
          </Link>
          <div className="ml-8 hidden flex-1 gap-8 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="text-primary-foreground hover:underline"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="ml-auto flex items-center gap-1">
            <Sheet>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-primary-foreground hover:bg-primary-foreground/10 md:hidden"
                >
                  <Menu className="h-5 w-5" />
                  <span className="sr-only">Open navigation menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="flex flex-col">
                <nav className="flex h-full flex-col items-center justify-center gap-8 text-center">
                  {navItems.map((item) => (
                    <SheetClose asChild key={item.to}>
                      <Link to={item.to} className="text-2xl font-semibold">
                        {item.label}
                      </Link>
                    </SheetClose>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
            <AccountNavItem />
          </div>
        </nav>
      </div>
    </header>
  );
};
