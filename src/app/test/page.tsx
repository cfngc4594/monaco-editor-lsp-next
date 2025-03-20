"use client";
import { useState } from "react";
import { judge, getProblems, getProblem } from "@/app/actions/random-judge";
import { EditorLanguage, ExitCode } from "@prisma/client";

export default function JudgeTestPage() {
    const [problems, setProblems] = useState([]);
    const [selectedProblem, setSelectedProblem] = useState(null);
    const [language, setLanguage] = useState(EditorLanguage.c);
    const [code, setCode] = useState("// 输入你的代码");
    const [result, setResult] = useState(null);
    const [loading, setLoading] = useState(false);

    async function loadProblems() {
        const data = await getProblems();
        setProblems(data);
    }

    async function selectProblem(id) {
        const problem = await getProblem(id);
        setSelectedProblem(problem);
    }

    async function submitCode() {
        setLoading(true);
        const formData = new FormData();
        formData.append("problemId", selectedProblem.id);
        formData.append("language", language);
        formData.append("code", code);

        const res = await judge(formData);
        setResult(res);
        setLoading(false);
    }

    return (
        <div className="p-6">
            <h1 className="text-xl font-bold">Judge System Test</h1>

            <button onClick={loadProblems} className="mt-4 p-2 bg-blue-500 text-white rounded">
                加载题目
            </button>

            {problems.length > 0 && (
                <ul className="mt-4">
                    {problems.map((p) => (
                        <li key={p.id}>
                            <button onClick={() => selectProblem(p.id)} className="text-blue-600">
                                {p.title} ({p.difficulty})
                            </button>
                        </li>
                    ))}
                </ul>
            )}

            {selectedProblem && (
                <div className="mt-6">
                    <h2 className="text-lg font-semibold">{selectedProblem.title}</h2>
                    <p className="text-gray-700">{selectedProblem.description}</p>

                    <select value={language} onChange={(e) => setLanguage(e.target.value)} className="mt-4 border p-2">
                        <option value={EditorLanguage.c}>C</option>
                        <option value={EditorLanguage.cpp}>C++</option>
                    </select>

                    <textarea
                        className="w-full mt-4 p-2 border rounded"
                        rows={6}
                        value={code}
                        onChange={(e) => setCode(e.target.value)}
                    />

                    <button onClick={submitCode} className="mt-4 p-2 bg-green-500 text-white rounded">
                        运行代码
                    </button>
                </div>
            )}

            {loading && <p className="mt-4">评测中...</p>}

            {result && (
                <div className="mt-6 border p-4 rounded bg-gray-100">
                    <h2 className="font-semibold">评测结果</h2>
                    <p>输入: {result.testCase?.input}</p>
                    <p>期望输出: {result.testCase?.expected}</p>
                    <p>实际输出: {result.testCase?.actual}</p>
                    <p>退出代码: {ExitCode[result.exitCode]}</p>
                </div>
            )}
        </div>
    );
}
