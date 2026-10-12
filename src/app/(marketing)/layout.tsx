import Link from "next/link";
import { Brand } from "@/components/brand";
import { buttonClasses } from "@/components/ui/button";
import { site } from "@/lib/site";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-5xl items-center gap-2 px-4 py-3 sm:px-6">
          <Brand />
          <nav aria-label="Site" className="ml-auto flex items-center gap-1">
            <Link
              href="/approach"
              className={buttonClasses({ variant: "ghost", size: "sm" })}
            >
              How it&apos;s built
            </Link>
            <Link
              href="/sign-in"
              className={buttonClasses({ variant: "secondary", size: "sm" })}
            >
              Sign in
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-line">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-6 text-sm text-muted sm:px-6">
          <p>
            {site.name} is a demo application
            {site.authorName && (
              <>
                {" "}
                built by{" "}
                {site.authorUrl ? (
                  <a
                    href={site.authorUrl}
                    className="font-medium text-ink underline underline-offset-2"
                  >
                    {site.authorName}
                  </a>
                ) : (
                  <span className="font-medium text-ink">{site.authorName}</span>
                )}
              </>
            )}
            .
          </p>
          {site.repoUrl && (
            <a
              href={site.repoUrl}
              className="font-medium text-ink underline underline-offset-2"
            >
              Source code
            </a>
          )}
        </div>
      </footer>
    </>
  );
}
