"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useCodeEditorState } from "@/store/useCodeEditor";
import { SUPPORTED_LANGUAGES } from "@/constants/language";

export default function LanguageSelector() {
  const { loading, language, setLanguage } = useCodeEditorState();

  if (loading) {
    return <Skeleton className="h-6 w-16 rounded-2xl" />;
  }

  return (
    <Select value={language} onValueChange={setLanguage}>
      <SelectTrigger className="h-6 px-1.5 py-0.5 border-none focus:ring-0 hover:bg-muted [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
        {SUPPORTED_LANGUAGES.map((lang) => (
          <SelectItem key={lang.id} value={lang.id}>
            {lang.icon}
            <span className="truncate text-sm font-semibold mr-2">
              {lang.label}
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
