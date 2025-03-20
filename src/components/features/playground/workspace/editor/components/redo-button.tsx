"use client";

import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Redo2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useProblemEditor } from "@/hooks/use-problem-editor";

export function RedoButton() {
  const { editor } = useProblemEditor();

  return (
    <TooltipProvider delayDuration={0}>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            aria-label="Redo Code"
            onClick={() => {
              editor?.trigger("redo", "redo", null);
            }}
            disabled={!editor}
            className="h-6 w-6 px-1.5 py-0.5 border-none shadow-none hover:bg-muted"
          >
            <Redo2 size={16} strokeWidth={2} aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent className="px-2 py-1 text-xs">
          Redo Code
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
