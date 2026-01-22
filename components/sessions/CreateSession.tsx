"use client";

import { EditSessionModal as NewSessionModal } from "@/components/sessions/EditSessionModal";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useState } from "react";

export const CreateSessionButton = () => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <NewSessionModal open={open} onClose={() => setOpen(false)} />

      <Button
        onClick={() => setOpen(true)}
        className="gap-2 shadow-xs hover:shadow-md transition-shadow"
      >
        <Plus className="h-4 w-4" />
        New Session
      </Button>
    </>
  );
};
