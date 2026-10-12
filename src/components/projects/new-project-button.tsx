"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProjectDialog } from "./project-dialog";

/** Opens the "New project" dialog and takes the user to the new board. */
export function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  return (
    <>
      <Button variant="primary" onClick={() => setOpen(true)}>
        <Plus className="size-4" aria-hidden="true" />
        New project
      </Button>
      <ProjectDialog
        open={open}
        onClose={() => setOpen(false)}
        onSaved={(project) => {
          setOpen(false);
          router.push(`/app/projects/${project.id}`);
        }}
      />
    </>
  );
}
