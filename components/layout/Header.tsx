import Image from "next/image";
import Link from "next/link";
import { AccountNavItem } from "./AccountNavItem";

export const Header = () => {
  return (
    <header className="bg-primary text-primary-foreground">
      <div className="mx-auto w-full px-4 sm:px-6 lg:px-8 max-w-(--breakpoint-xl)">
        <nav className="flex items-center py-4">
          <Link href="/">
            <Image
              src="/logo-bg-white.png"
              alt="logo"
              priority
              width={40}
              height={40}
            />
          </Link>
          <div className="ml-8 hidden flex-1 gap-8 md:flex">
            <Link
              href="/routines"
              className="text-primary-foreground hover:underline"
            >
              Routines
            </Link>
            <Link
              href="/exercises"
              className="text-primary-foreground hover:underline"
            >
              Exercises
            </Link>
            <Link
              href="/logs"
              className="text-primary-foreground hover:underline"
            >
              Logs
            </Link>
          </div>
          <AccountNavItem />
        </nav>
      </div>
    </header>
  );
};
