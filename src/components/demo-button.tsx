"use client";

import { useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { api, errorMessage } from "@/lib/api-client";
import { reloadTo } from "@/lib/navigation";

/** Creates a private demo workspace and opens the app, with no sign-up. */
export function DemoButton({
  variant = "primary",
  className,
  children = "Try the live demo",
}: {
  variant?: "primary" | "secondary";
  className?: string;
  children?: ReactNode;
}) {
  const [pending, setPending] = useState(false);
  const toast = useToast();

  async function start() {
    setPending(true);
    try {
      await api.demo.start();
      reloadTo("/app");
    } catch (error) {
      setPending(false);
      toast.error(errorMessage(error));
    }
  }

  return (
    <Button
      variant={variant}
      loading={pending}
      onClick={start}
      className={className}
    >
      {pending ? "Setting up your workspace" : children}
    </Button>
  );
}
