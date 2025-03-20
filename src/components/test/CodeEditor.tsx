// components/client/CodeEditor.tsx
'use client';

import { useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { getProblem } from '@/app/actions/random-judge';
import { EditorLanguage } from '@prisma/client';


type Props = {
  name: string;
  language: EditorLanguage;
  disabled?: boolean;
  problemId?: string;
};

export default function CodeEditor(props: Props) {
  const [code, setCode] = useState('');
  const [template, setTemplate] = useState('');

  useEffect(() => {
    if (props.problemId && props.language) {
      getProblem(props.problemId).then(problem => {
        const template = problem.templates.find(
          t => t.language === props.language
        )?.template || '';
        setCode(template);
        setTemplate(template);
      });
    }
  }, [props.problemId, props.language]);

  return (
    <div className="border rounded overflow-hidden">
      <input type="hidden" name={props.name} value={code} />
      <Editor
        height="60vh"
        language={props.language}
        theme="vs-dark"
        value={code}
        onChange={value => setCode(value ?? '')}
        options={{
          readOnly: props.disabled,
          minimap: { enabled: false },
          lineNumbers: "on",
          roundedSelection: false,
          scrollBeyondLastLine: false,
          automaticLayout: true
        }}
      />

      <div className="p-2 bg-base-200 flex justify-between">
        <button
          type="button"
          onClick={() => setCode(template)}
          className="btn btn-xs"
        >
          重置代码
        </button>
        <span className="text-sm opacity-75">
          {props.language.toUpperCase()} 语言环境
        </span>
      </div>
    </div>
  );
}
