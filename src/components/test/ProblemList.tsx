// app/test/list.tsx

"use client";

import { useEffect, useState } from "react";
import { getProblems } from "@/app/actions/random-judge"; // 引入获取题目列表的函数
import { Problem } from "@prisma/client"; // 假设问题类型为 Problem

const ProblemList = () => {
    const [problems, setProblems] = useState<Problem[]>([]); // 用来存储题目列表
    const [selectedProblem, setSelectedProblem] = useState<string | null>(null); // 用来存储选中的题目ID
    const [loading, setLoading] = useState<boolean>(true); // 控制加载状态

    useEffect(() => {
        const fetchProblems = async () => {
            try {
                const problemsData = await getProblems(); // 获取题目数据
                setProblems(problemsData); // 设置题目数据

                if (problemsData.length > 0) {
                    setSelectedProblem(problemsData[0].id); // 默认选择第一个题目
                }
            } catch (error) {
                console.error("获取题目列表失败", error);
            } finally {
                setLoading(false); // 加载完毕
            }
        };

        fetchProblems();
    }, []);

    const handleSelectChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedProblem(event.target.value); // 更新选中的题目ID
    };

    if (loading) {
        return <div>加载中...</div>; // 在加载时显示
    }

    return (
        <div>
            <h1>题目列表</h1>
            <select
                className="select select-bordered w-full"
                onChange={handleSelectChange}
                value={selectedProblem} // 设置选中的题目
            >
                <option value="" disabled>
                    请选择一个题目
                </option>
                {problems.map((problem) => (
                    <option key={problem.id} value={problem.id}>
                        {problem.title} - <span className="badge badge-neutral">{problem.difficulty}</span>
                    </option>
                ))}
            </select>

            <div>
                {selectedProblem && (
                    <p>当前选择的题目ID是: {selectedProblem}</p> // 显示当前选择的题目ID
                )}
            </div>
        </div>
    );
};

export default ProblemList;
