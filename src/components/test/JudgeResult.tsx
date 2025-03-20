// app/judge/JudgeResult.tsx
'use client';

import { useEffect, useState } from 'react';
import { ExitCode } from '@prisma/client';
import { RandomJudgeResult } from '@/app/actions/random-judge';

const statusMap: Record<ExitCode, string> = {
  SE: '系统错误',
  CS: '编译成功',
  CE: '编译错误',
  TLE: '超时限制',
  MLE: '内存溢出',
  RE: '运行错误',
  AC: '答案正确',
  WA: '答案错误'
};

export default function JudgeResult({
  initialData,
  className
}: {
  initialData?: RandomJudgeResult;
  className?: string;
}) {
  const [result, setResult] = useState(initialData);

  useEffect(() => {
    setResult(initialData);
  }, [initialData]);

  if (!result) return null;

  return (
    <div className={`${className} space-y-4`}>
      <div className={`alert ${
        result.exitCode === 'AC' ? 'alert-success' : 'alert-error'
      }`}>
        <span>判题结果：{statusMap[result.exitCode]}</span>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {result.testCase && (
          <div className="mockup-code">
            <pre>输入参数：{result.testCase.input}</pre>
            <pre>预期输出：{result.testCase.expected}</pre>
            <pre>实际输出：{result.testCase.actual}</pre>
          </div>
        )}

        <div className="stats shadow">
          <div className="stat">
            <div className="stat-title">执行时间</div>
            <div className="stat-value">
              {result.executionTime ?? '--'}ms
            </div>
          </div>
          <div className="stat">
            <div className="stat-title">内存消耗</div>
            <div className="stat-value">
              {result.memoryUsage ? `${result.memoryUsage}MB` : '--'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
