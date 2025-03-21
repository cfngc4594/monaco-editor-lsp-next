import type {
  EditorLanguage,
  EditorLanguageConfig,
  LanguageServerConfig,
  Template,
} from "@prisma/client";
import type { editor } from "monaco-editor";
import { createStore } from "zustand/vanilla";
import { createJSONStorage, persist } from "zustand/middleware";
import type { MonacoLanguageClient } from "monaco-languageclient";

export type ProblemState = {
  hydrated: boolean;
  editor: editor.IStandaloneCodeEditor | null;
  monacoLanguageClient: MonacoLanguageClient | null;
  globalLang: EditorLanguage;
  currentLang: EditorLanguage;
  currentValue: string;
  problemId: string;
  templates: Template[];
  editorLanguageConfigs: EditorLanguageConfig[];
  languageServerConfigs: LanguageServerConfig[];
};

export type ProblemActions = {
  setHydrated: (value: boolean) => void;
  setEditor: (editor: editor.IStandaloneCodeEditor) => void;
  setMonacoLanguageClient: (client: MonacoLanguageClient | null) => void;
  setGlobalLang: (lang: EditorLanguage) => void;
  setCurrentLang: (lang: EditorLanguage) => void;
  setCurrentValue: (value: string) => void;
};

export type ProblemStore = ProblemState & ProblemActions;

export const createProblemStore = (initState: ProblemState) => {
  return createStore<ProblemStore>()(
    persist(
      (set) => ({
        ...initState,
        setHydrated: (value) => set({ hydrated: value }),
        setEditor: (editor) => set({ editor }),
        setMonacoLanguageClient: (client) => set({ monacoLanguageClient: client }),
        setGlobalLang: (lang) => set({ globalLang: lang }),
        setCurrentLang: (lang) => set({ currentLang: lang }),
        setCurrentValue: (value) => set({ currentValue: value }),
      }),
      {
        name: "problem-store",
        storage: createJSONStorage(() => localStorage),
        partialize: (state) => ({
          globalLang: state.globalLang,
        }),
        onRehydrateStorage: () => {
          return (state, error) => {
            if (error) {
              console.error("An error happened during hydration", error);
            } else if (state) {
              state.setHydrated(true);
            }
          };
        },
      }
    )
  );
};
