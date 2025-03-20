// app/judge/ProblemDescription.tsx
import { getProblem } from '@/app/actions/random-judge';

export default async function ProblemDescription({
  problemId
}: {
  problemId: string
}) {
  const problem = await getProblem(problemId);

  return (
    <div className="card bg-base-100 shadow">
      <div className="card-body">
        <h1 className="card-title">{problem.title}</h1>
        <div className="prose max-w-none">
          <div dangerouslySetInnerHTML={{ __html: problem.description }} />

          <h3>输入规范</h3>
          <pre>{JSON.stringify(
            problem.ReferenceCode[0]?.inputSchema,
            null, 2
          )}</pre>

          <h3>示例代码</h3>
          <pre className="bg-base-200 p-4 rounded">
            {problem.templates[0]?.template}
          </pre>
        </div>
      </div>
    </div>
  );
}
