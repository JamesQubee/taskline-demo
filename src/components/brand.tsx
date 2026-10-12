import Link from "next/link";
import { cn } from "@/lib/cn";
import { APP_NAME } from "@/lib/constants";

export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-7 items-end justify-center gap-[3px] rounded-lg bg-brand p-[7px]",
        className,
      )}
    >
      {/* Three columns of different heights: a tiny board. */}
      <span className="h-full w-[3px] rounded-full bg-on-brand" />
      <span className="h-2/3 w-[3px] rounded-full bg-on-brand" />
      <span className="h-1/3 w-[3px] rounded-full bg-on-brand" />
    </span>
  );
}

export function Brand({
  href = "/",
  compact = false,
}: {
  href?: string;
  /** Shows only the mark, for tight spaces like the mobile header. */
  compact?: boolean;
}) {
  return (
    <Link
      href={href}
      aria-label={compact ? APP_NAME : undefined}
      className="flex items-center gap-2 rounded-control font-semibold tracking-tight"
    >
      <BrandMark />
      {!compact && <span>{APP_NAME}</span>}
    </Link>
  );
}
