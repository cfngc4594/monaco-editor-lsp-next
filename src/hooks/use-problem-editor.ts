import { getPath } from "@/lib/utils";
import { EditorLanguage } from "@prisma/client";
import { useCallback, useEffect, useMemo } from "react";
import { useProblemEditorStoreInstance } from "@/providers/problem-editor-provider";

/**
 * Generates a unique localStorage key for storing the editor language of a problem.
 */
const getProblemLangStorageKey = (problemId: string) => `lang_${problemId}`;

/**
 * Generates a unique localStorage key for storing the editor content of a problem.
 */
const getProblemValueStorageKey = (problemId: string) => `value_${problemId}`;

/**
 * Retrieves the stored editor language for a specific problem.
 * If no value is found, it falls back to the global editor language.
 */
const getStoredProblemLang = (problemId: string, globalLang: EditorLanguage) =>
  (localStorage.getItem(getProblemLangStorageKey(problemId)) as EditorLanguage) ?? globalLang;

/**
 * Retrieves the stored editor content for a specific problem.
 * If no value is found, it falls back to the default template.
 */
const getStoredProblemValue = (problemId: string, defaultValue: string) =>
  localStorage.getItem(getProblemValueStorageKey(problemId)) ?? defaultValue;

export const useProblemEditor = () => {
  const {
    globalLang,
    currentLang,
    currentValue,
    setGlobalLang,
    setCurrentLang,
    setCurrentValue,
    problemId,
    templates,
    editorLanguageConfigs,
    languageServerConfigs,
  } = useProblemEditorStoreInstance().getState();

  const currentTemplate = useMemo(() => {
    return templates.find((t) => t.language === currentLang)?.template || "";
  }, [templates, currentLang]);

  const currentEditorLanguageConfig = useMemo(
    () => editorLanguageConfigs.find((c) => c.language === currentLang),
    [editorLanguageConfigs, currentLang]
  );

  const currentLanguageServerConfig = useMemo(
    () => languageServerConfigs.find((c) => c.language === currentLang),
    [languageServerConfigs, currentLang]
  );

  const currentPath = useMemo(() => {
    return currentEditorLanguageConfig ? getPath(currentEditorLanguageConfig) : "";
  }, [currentEditorLanguageConfig]);

  useEffect(() => {
    const storedLang = getStoredProblemLang(problemId, globalLang);
    setCurrentLang(storedLang);

    const storedValue = getStoredProblemValue(problemId, currentTemplate);
    setCurrentValue(storedValue);
  }, [problemId, globalLang, currentTemplate, setCurrentLang, setCurrentValue]);

  const changeLang = useCallback(
    (newLang: EditorLanguage) => {
      if (!problemId || newLang === currentLang) return;

      localStorage.setItem(getProblemLangStorageKey(problemId), newLang);
      setCurrentLang(newLang);
      setGlobalLang(newLang);
    },
    [problemId, currentLang, setCurrentLang, setGlobalLang]
  );

  const changeValue = useCallback(
    (newValue: string) => {
      if (!problemId || newValue === currentValue) return;

      localStorage.setItem(getProblemValueStorageKey(problemId), newValue);
      setCurrentValue(newValue);
    },
    [problemId, currentValue, setCurrentValue]
  );

  return {
    globalLang,
    currentLang,
    currentValue,
    problemId,
    templates,
    editorLanguageConfigs,
    languageServerConfigs,
    currentTemplate,
    currentEditorLanguageConfig,
    currentLanguageServerConfig,
    currentPath,
    changeLang,
    changeValue,
  };
};
