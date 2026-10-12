import { Suspense } from "react";
import { NavLinks, NavLinksView } from "@/components/app/nav-links";
import { UserBadge } from "@/components/app/user-badge";
import { Brand } from "@/components/brand";
import { Skeleton } from "@/components/ui/primitives";
import { requireUser } from "@/server/session";

// The shell (brand, navigation, page frame) is static and paints immediately.
// Anything that needs the session streams in behind its own Suspense boundary.

async function CurrentUser({ compact }: { compact?: boolean }) {
  const user = await requireUser();
  return <UserBadge user={user} compact={compact} />;
}

function Navigation({ orientation }: { orientation: "vertical" | "horizontal" }) {
  return (
    <nav aria-label="Main">
      <Suspense
        fallback={<NavLinksView pathname={null} orientation={orientation} />}
      >
        <NavLinks orientation={orientation} />
      </Suspense>
    </nav>
  );
}

export default function AppLayout({ children }: LayoutProps<"/app">) {
  return (
    <div className="flex min-h-dvh flex-col md:flex-row">
      <aside className="sticky top-0 hidden h-dvh w-60 shrink-0 flex-col gap-8 border-r border-line bg-surface p-4 md:flex">
        <div className="px-1 pt-1">
          <Brand href="/app" />
        </div>
        <Navigation orientation="vertical" />
        <div className="mt-auto border-t border-line pt-4">
          <Suspense
            fallback={
              <div className="flex items-center gap-2.5">
                <Skeleton className="size-8 rounded-full" />
                <Skeleton className="h-8 flex-1" />
              </div>
            }
          >
            <CurrentUser />
          </Suspense>
        </div>
      </aside>

      <header className="sticky top-0 z-20 flex items-center gap-2 border-b border-line bg-surface px-3 py-2 md:hidden">
        <Brand href="/app" compact />
        <div className="min-w-0 flex-1">
          <Navigation orientation="horizontal" />
        </div>
        <Suspense fallback={<Skeleton className="size-8 rounded-full" />}>
          <CurrentUser compact />
        </Suspense>
      </header>

      <main className="min-w-0 flex-1 px-4 py-6 md:px-8 md:py-8">
        <div className="mx-auto max-w-6xl">{children}</div>
      </main>
    </div>
  );
}
