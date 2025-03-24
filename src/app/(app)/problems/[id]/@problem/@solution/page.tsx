"use client";

import { useProblem } from "@/hooks/use-problem";
import MdxPreview from "@/components/mdx-preview";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import ProblemSolutionFooter from "@/components/features/playground/problem/solution/footer";

export default function ProblemSolutionPage() {
  const { problem } = useProblem();

  return (
    <>
      <div className="flex-1">
        <ScrollArea className="[&>[data-radix-scroll-area-viewport]]:max-h-[calc(100vh-130px)]">
          <MdxPreview source={problem.solution} className="box-border min-w-[200px] max-w-[980px] mx-auto p-4 md:p-6" />
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </div>
      <ProblemSolutionFooter title={problem.title} />
    </>
  );
}
