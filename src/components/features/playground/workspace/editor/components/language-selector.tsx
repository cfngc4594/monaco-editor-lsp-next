"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPath } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import { EditorLanguageIcons } from "@/config/editor-language-icons";
import { EditorLanguage, EditorLanguageConfig, LanguageServerConfig } from "@prisma/client";

interface LanguageSelectorProps {
  editorLanguageConfigs: EditorLanguageConfig[];
  languageServerConfigs: LanguageServerConfig[];
}

export default function LanguageSelector({
  editorLanguageConfigs,
  languageServerConfigs,
}: LanguageSelectorProps) {
  const { hydrated, language, setLanguage, setPath, setLspConfig } = useCodeEditorStore();

  if (!hydrated) {
    return <Skeleton className="h-6 w-16 rounded-2xl" />;
  }

  const handleValueChange = (lang: EditorLanguage) => {
    setLanguage(lang);
    const selectedEditorLanguageConfig = editorLanguageConfigs.find(
      (config) => config.language === lang
    );
    const selectedLanguageServerConfig = languageServerConfigs.find(
      (config) => config.language === lang
    );
    setPath(selectedEditorLanguageConfig ? getPath(selectedEditorLanguageConfig) : "");
    setLspConfig(selectedLanguageServerConfig || null);
  };

  return (
    <Select value={language} onValueChange={handleValueChange}>
      <SelectTrigger className="h-6 px-1.5 py-0.5 border-none shadow-none focus:ring-0 hover:bg-muted [&>span]:flex [&>span]:items-center [&>span]:gap-2 [&>span_svg]:shrink-0 [&>span_svg]:text-muted-foreground/80">
        <SelectValue placeholder="Select language" />
      </SelectTrigger>
      <SelectContent className="[&_*[role=option]>span>svg]:shrink-0 [&_*[role=option]>span>svg]:text-muted-foreground/80 [&_*[role=option]>span]:end-2 [&_*[role=option]>span]:start-auto [&_*[role=option]>span]:flex [&_*[role=option]>span]:items-center [&_*[role=option]>span]:gap-2 [&_*[role=option]]:pe-8 [&_*[role=option]]:ps-2">
        {editorLanguageConfigs.map((config) => {
          const Icon = EditorLanguageIcons[config.language];
          return (
            <SelectItem key={config.language} value={config.language}>
              <Icon size={16} aria-hidden="true" />
              <span className="truncate text-sm font-semibold mr-2">
                {config.label}
              </span>
            </SelectItem>
          );
        })}
      </SelectContent>
    </Select>
  );
}
