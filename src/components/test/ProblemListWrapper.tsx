// app/components/test/ProblemListWrapper.tsx
'use client';

import { useState } from 'react';
import ProblemList from './ProblemList';
import { Problem } from "@prisma/client";


interface ProblemListWrapperProps {
    problems: Problem[];  // Received as props from Server Component
    onSelect: (id: string) => void;
}

export default function ProblemListWrapper({ problems, onSelect }: ProblemListWrapperProps) {
    const [selectedProblem, setSelectedProblem] = useState<string | null>(null);

    const handleSelectProblem = (id: string) => {
        setSelectedProblem(id); // Update the selected problem
        onSelect(id);  // Pass it to the parent component
    };

    return (
        <div className="space-y-2">
            <h2 className="text-xl font-bold">题目列表</h2>
            <ProblemList problems={problems} onSelect={handleSelectProblem} />
            {selectedProblem && (
                <div className="mt-4">
                    <span>已选择题目 ID: {selectedProblem}</span>
                </div>
            )}
        </div>
    );
}
