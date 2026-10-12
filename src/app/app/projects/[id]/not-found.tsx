import Link from "next/link";
import { SearchX } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";

export default function ProjectNotFound() {
  return (
    <EmptyState
      icon={<SearchX className="size-5" aria-hidden="true" />}
      title="Project not found"
      description="It may have been deleted, or the link may be wrong."
      action={
        <Link href="/app/projects" className={buttonClasses({ variant: "primary" })}>
          Back to projects
        </Link>
      }
    />
  );
}
