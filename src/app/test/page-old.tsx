// app/judge/page.tsx
'use client';

import { useState, useTransition, useCallback,useEffect } from 'react';
//import ProblemListWrapper from '@/components/test/ProblemListWrapper';
import ProblemDescription from '@/components/test/ProblemDescription';
import CodeEditor from '@/components/test/CodeEditor';
import JudgeStatus from '@/components/test/JudgeStatus';
import JudgeResult from '@/components/test/JudgeResult';
import { EditorLanguage, JudgeResult as PrismaJudgeResult } from '@prisma/client';
import { judge, type RandomJudgeResult } from '@/app/actions/random-judge';

export default function JudgePage() {
    const [isPending, startTransition] = useTransition();
    const [result, setResult] = useState<RandomJudgeResult>();
    const [selectedProblem, setProblem] = useState<string>();
    const [language, setLanguage] = useState<EditorLanguage>(EditorLanguage.cpp);
    //const [selectedProblem, setProblem] = useState<string>('cm8gygiap0003vz25fxzr5kpe');



    const handleSelectProblem = useCallback((id: string) => {
        setProblem(id);
    }, []);

    const handleSubmit = (formData: FormData) => {
        startTransition(async () => {
            const res = await judge(formData);
            setResult(res);
        });
    };

    return (
        <div className="grid grid-cols-3 gap-8 p-6">
            <div className="space-y-6">
                <ProblemListWrapper onSelect={handleSelectProblem} problems={[]} />
                {selectedProblem && (
                    <ProblemDescription problemId={selectedProblem} />
                )}
            </div>

            <form
                action={handleSubmit}
                className="col-span-2 space-y-4"
                onSubmit={(e) => {
                    if (!selectedProblem) {
                        e.preventDefault();

                        alert('请先选择题目');
                    }
                }}
            >
                <input type="hidden" name="problemId" value={selectedProblem} />

                <div className="flex gap-4">
                    <select
                        name="language"
                        className="select select-bordered"
                        value={language}
                        onChange={(e) => setLanguage(e.target.value as EditorLanguage)}
                    >
                        {Object.values(EditorLanguage).map((lang) => (
                            <option key={lang} value={lang}>
                                {lang.toUpperCase()}
                            </option>
                        ))}
                    </select>
                </div>

                <CodeEditor
                    name="code"
                    language={language}
                    disabled={isPending}
                    problemId={selectedProblem}
                />

                <JudgeStatus isPending={isPending} />
            </form>

            <JudgeResult
                initialData={result}
                className="col-span-full"
            />
        </div>
    );
}
