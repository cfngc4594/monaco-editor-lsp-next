import { cn } from "@/lib/utils";
import CopyButton from "./components/copy-button";
import RedoButton from "./components/redo-button";
import UndoButton from "./components/undo-button";
import ResetButton from "./components/reset-button";
import FormatButton from "./components/format-button";
import LanguageSelector from "./components/language-selector";

interface WorkspaceEditorHeaderProps {
  className?: string;
}

export default function WorkspaceEditorHeader({
  className,
  ...props
}: WorkspaceEditorHeaderProps) {
  return (
    <header
      {...props}
      className={cn("h-8 flex flex-none items-center px-2 border-b", className)}
    >
      <div className="w-full flex items-center justify-between">
        <div className="flex items-center gap-x-2">
          <LanguageSelector />
        </div>
        <div className="flex items-center gap-x-2">
          <ResetButton />
          <UndoButton />
          <RedoButton />
          <FormatButton />
          <CopyButton />
        </div>
      </div>
    </header>
  );
}
