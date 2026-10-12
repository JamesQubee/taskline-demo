"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { DemoButton } from "@/components/demo-button";
import { Button } from "@/components/ui/button";
import { TextField } from "@/components/ui/field";
import { authClient } from "@/lib/auth-client";
import { LIMITS } from "@/lib/constants";
import { reloadTo } from "@/lib/navigation";
import { fieldErrors, signInSchema, signUpSchema } from "@/lib/validation";

type Mode = "sign-in" | "sign-up";

const COPY: Record<
  Mode,
  { title: string; submit: string; switchText: string; switchLabel: string; switchHref: string }
> = {
  "sign-in": {
    title: "Sign in",
    submit: "Sign in",
    switchText: "New here?",
    switchLabel: "Create an account",
    switchHref: "/sign-up",
  },
  "sign-up": {
    title: "Create your account",
    submit: "Create account",
    switchText: "Already have an account?",
    switchLabel: "Sign in",
    switchHref: "/sign-in",
  },
};

// Messages for the failures a visitor can actually fix.
function describeAuthError(mode: Mode, error: { code?: string; status: number }) {
  if (mode === "sign-up" && error.code?.startsWith("USER_ALREADY_EXISTS")) {
    return "An account with this email already exists. Sign in instead.";
  }
  if (mode === "sign-in" && error.status === 401) {
    return "That email and password do not match an account.";
  }
  if (error.status === 429) {
    return "Too many attempts. Wait a minute and try again.";
  }
  return "Something went wrong. Try again.";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [pending, setPending] = useState(false);
  const copy = COPY[mode];

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const values = Object.fromEntries(new FormData(event.currentTarget));

    const parsed =
      mode === "sign-up"
        ? signUpSchema.safeParse(values)
        : signInSchema.safeParse(values);
    if (!parsed.success) {
      setErrors(fieldErrors(parsed.error));
      return;
    }

    setErrors({});
    setPending(true);
    const { error } =
      mode === "sign-up"
        ? await authClient.signUp.email(signUpSchema.parse(values))
        : await authClient.signIn.email(signInSchema.parse(values));

    if (error) {
      setPending(false);
      setErrors({ form: describeAuthError(mode, error) });
      return;
    }
    reloadTo("/app");
  }

  return (
    <>
      <h1 className="text-xl font-semibold tracking-tight">{copy.title}</h1>

      <form onSubmit={onSubmit} noValidate className="mt-5 flex flex-col gap-4">
        {mode === "sign-up" && (
          <TextField
            label="Name"
            name="name"
            autoComplete="name"
            error={errors.name}
          />
        )}
        <TextField
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          inputMode="email"
          error={errors.email}
        />
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
          hint={
            mode === "sign-up"
              ? `At least ${LIMITS.passwordMin} characters.`
              : undefined
          }
          error={errors.password}
        />

        {errors.form && (
          <p role="alert" className="rounded-control bg-danger-soft px-3 py-2 text-sm text-danger">
            {errors.form}
          </p>
        )}

        <Button type="submit" variant="primary" loading={pending}>
          {copy.submit}
        </Button>
      </form>

      <p className="mt-4 text-sm text-muted">
        {copy.switchText}{" "}
        <Link
          href={copy.switchHref}
          className="font-medium text-brand underline-offset-2 hover:underline"
        >
          {copy.switchLabel}
        </Link>
      </p>

      <div className="mt-6 border-t border-line pt-5">
        <p className="mb-3 text-sm text-muted">
          Just looking? Open a private workspace with sample data. No sign-up.
        </p>
        <DemoButton variant="secondary" className="w-full" />
      </div>
    </>
  );
}
