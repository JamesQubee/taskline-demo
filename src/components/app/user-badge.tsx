"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { authClient } from "@/lib/auth-client";
import { reloadTo } from "@/lib/navigation";
import type { CurrentUser } from "@/lib/types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}

export function UserBadge({
  user,
  compact = false,
}: {
  user: CurrentUser;
  /** Avatar and sign-out only, for the mobile header. */
  compact?: boolean;
}) {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  async function signOut() {
    setPending(true);
    const { error } = await authClient.signOut();
    if (error) {
      setPending(false);
      toast.error("Could not sign out. Try again.");
      return;
    }
    reloadTo("/");
  }

  return (
    <div className="flex items-center gap-2.5">
      <span
        aria-hidden="true"
        className="flex size-8 shrink-0 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-strong"
      >
        {initials(user.name) || "?"}
      </span>
      {!compact && (
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-sm font-medium">{user.name}</p>
          <p className="truncate text-xs text-muted">
            {user.isDemo ? "Demo workspace" : user.email}
          </p>
        </div>
      )}
      <button
        type="button"
        onClick={signOut}
        disabled={pending}
        aria-label="Sign out"
        title="Sign out"
        className="rounded-control p-2 text-muted hover:bg-sunken hover:text-ink disabled:opacity-60"
      >
        <LogOut className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
