"use client";

import dynamic from "next/dynamic";
import { Skeleton } from "./ui/skeleton";
import { highlighter } from "@/lib/shiki";
import type { editor } from "monaco-editor";
import { EditorLanguage } from "@prisma/client";
import { shikiToMonaco } from "@shikijs/monaco";
import type { Monaco } from "@monaco-editor/react";
import { useCallback, useEffect, useRef } from "react";
import { useMonacoTheme } from "@/hooks/use-monaco-theme";
import LanguageServerConfig from "@/config/language-server";
import { connectToLanguageServer } from "@/lib/language-server";
import { useCodeEditorStore } from "@/store/useCodeEditorStore";
import type { MonacoLanguageClient } from "monaco-languageclient";

// Skeleton component for loading state
const CodeEditorLoadingSkeleton = () => (
  <div className="h-full w-full p-2">
    <Skeleton className="h-full w-full rounded-3xl" />
  </div>
);

// Dynamically import Monaco Editor with SSR disabled
const Editor = dynamic(
  async () => {
    await import("vscode");
    const monaco = await import("monaco-editor");
    const { loader } = await import("@monaco-editor/react");
    loader.config({ monaco });
    return (await import("@monaco-editor/react")).Editor;
  },
  {
    ssr: false,
    loading: () => <CodeEditorLoadingSkeleton />,
  }
);

interface CodeEditorProps {
  problemId: string;
  templates: { language: EditorLanguage; template: string }[];
}

export default function CodeEditor({
  problemId,
  templates,
}: CodeEditorProps) {
  const {
    hydrated,
    language,
    path,
    value,
    editorConfig,
    isLspEnabled,
    setEditor,
    setValue,
  } = useCodeEditorStore();
  const { monacoTheme } = useMonacoTheme();
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const monacoLanguageClientRef = useRef<MonacoLanguageClient | null>(null);

  const valueStorageKey = `value_${problemId}_${language}`;

  useEffect(() => {
    const storedValue = localStorage.getItem(valueStorageKey);
    if (storedValue !== null) {
      setValue(storedValue);
    } else {
      const currentTemplate = templates.find((t) => t.language === language)?.template ?? "";
      setValue(currentTemplate);
    }
  }, [valueStorageKey, setValue, templates, language])

  const handleEditorChange = (value: string | undefined) => {
    if (value === undefined) return;
    setValue(value);
    localStorage.setItem(valueStorageKey, value);
  }

  // Connect to LSP only if enabled
  const connectLSP = useCallback(async () => {
    if (!(isLspEnabled && language && editorRef.current)) return;

    const lspConfig = LanguageServerConfig[language];

    if (!lspConfig) return;

    // If there's an existing language client, stop it first
    if (monacoLanguageClientRef.current) {
      monacoLanguageClientRef.current.stop();
      monacoLanguageClientRef.current = null;
    }

    // Create a new language client
    try {
      const monacoLanguageClient = await connectToLanguageServer(
        lspConfig.protocol,
        lspConfig.hostname,
        lspConfig.port,
        lspConfig.path,
        lspConfig.lang
      );
      monacoLanguageClientRef.current = monacoLanguageClient;
    } catch (error) {
      console.error("Failed to connect to LSP:", error);
    }
  }, [isLspEnabled, language]);

  // Connect to LSP once the editor has mounted
  const handleEditorDidMount = useCallback(
    async (editor: editor.IStandaloneCodeEditor) => {
      editorRef.current = editor;
      await connectLSP();
      setEditor(editor);
    },
    [connectLSP, setEditor]
  );

  // Reconnect to the LSP whenever language or lspConfig changes
  useEffect(() => {
    connectLSP();
  }, [connectLSP]);

  // Cleanup the LSP connection when the component unmounts
  useEffect(() => {
    return () => {
      if (monacoLanguageClientRef.current) {
        monacoLanguageClientRef.current.stop();
        monacoLanguageClientRef.current = null;
      }
    };
  }, []);

  if (!hydrated) {
    return <CodeEditorLoadingSkeleton />;
  }

  const handleEditorWillMount = (monaco: Monaco) => {
    shikiToMonaco(highlighter, monaco);
  }

  return (
    <Editor
      language={language}
      theme={monacoTheme.id}
      path={path}
      value={value}
      beforeMount={handleEditorWillMount}
      onMount={handleEditorDidMount}
      onChange={handleEditorChange}
      options={editorConfig}
      loading={<CodeEditorLoadingSkeleton />}
      className="h-full w-full py-2"
    />
  );
}
