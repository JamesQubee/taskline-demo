import { APP_NAME } from "./constants";

// Details shown on the public pages. Set them as environment variables so the
// same code can be deployed under a different name without edits.
export const site = {
  name: APP_NAME,
  description:
    "A small, complete project tracker built with Next.js, TypeScript, Tailwind CSS and Postgres.",
  authorName: process.env.NEXT_PUBLIC_AUTHOR_NAME ?? "",
  authorUrl: process.env.NEXT_PUBLIC_AUTHOR_URL ?? "",
  repoUrl: process.env.NEXT_PUBLIC_REPO_URL ?? "",
};
