"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FolderKanban, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/cn";

const LINKS = [
  { href: "/app", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/app/projects", label: "Projects", icon: FolderKanban, exact: false },
];

type Orientation = "vertical" | "horizontal";

/**
 * The links themselves. Rendered with `pathname={null}` as the Suspense
 * fallback, so the navigation is in the static shell before the URL is known.
 */
export function NavLinksView({
  pathname,
  orientation,
}: {
  pathname: string | null;
  orientation: Orientation;
}) {
  return (
    <ul
      className={cn(
        "flex gap-1",
        orientation === "vertical" ? "flex-col" : "items-center",
      )}
    >
      {LINKS.map(({ href, label, icon: Icon, exact }) => {
        const active =
          pathname !== null &&
          (exact ? pathname === href : pathname.startsWith(href));
        return (
          <li key={href}>
            <Link
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-2.5 rounded-control px-3 py-2 text-sm font-medium transition-colors",
                active
                  ? "bg-brand-soft text-brand-strong"
                  : "text-muted hover:bg-sunken hover:text-ink",
              )}
            >
              <Icon className="size-4 shrink-0" aria-hidden="true" />
              {label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function NavLinks({ orientation }: { orientation: Orientation }) {
  const pathname = usePathname();
  return <NavLinksView pathname={pathname} orientation={orientation} />;
}
