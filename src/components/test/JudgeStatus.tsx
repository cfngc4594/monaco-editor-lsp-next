// components/client/JudgeStatus.tsx
'use client';

import { useEffect, useState } from 'react';

export default function JudgeStatus({
                                      isPending
                                    }: {
  isPending: boolean
}) {
  const [dots, setDots] = useState(0);
  const [questionId, setQuestionId] = useState(''); // State to hold the manually entered question ID

  useEffect(() => {
    if (!isPending) return;

    const timer = setInterval(() => {
      setDots(prev => (prev + 1) % 4);
    }, 500);

    return () => clearInterval(timer);
  }, [isPending]);

  return isPending ? (
      <div className="alert alert-info">
        <span className="loading loading-dots loading-md" />
        <span>判题中{'.'.repeat(dots)}</span>
      </div>
  ) : (
      <div>
        <div className="mb-2">
          <label htmlFor="questionId" className="block text-sm font-medium text-gray-700">题目ID</label>
          <input
              type="text"
              id="questionId"
              value={questionId}
              onChange={(e) => setQuestionId(e.target.value)}
              className="mt-1 p-2 border rounded-md w-full"
              placeholder="请输入题目ID"
          />
        </div>
        <button
            type="submit"
            className="btn btn-primary w-full"
        >
          提交代码
        </button>
      </div>
  );
}
