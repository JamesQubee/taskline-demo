import Link from "next/link";
import { Brand } from "@/components/brand";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-16 text-center">
      <Brand />
      <h1 className="mt-8 text-2xl font-semibold tracking-tight">
        Page not found
      </h1>
      <p className="mt-2 max-w-sm text-sm text-muted">
        The page you are looking for does not exist or has moved.
      </p>
      <Link href="/" className={buttonClasses({ variant: "primary", className: "mt-6" })}>
        Go to the home page
      </Link>
    </div>
  );
}
