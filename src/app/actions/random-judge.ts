// app/actions/judge.ts
"use server";

import tar from "tar-stream";
import Docker from "dockerode";
import prisma from "@/lib/prisma";
import { v4 as uuid } from "uuid";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Readable, Writable } from "stream";
import { ExitCode, EditorLanguage, JudgeResult, Problem, ReferenceCode } from "@prisma/client";
import { z } from "zod";

// 类型扩展
type InputSchema = {
  type: "integer" | "array";
  min?: number;
  max?: number;
  length?: number;
  items?: InputSchema;
};

export type RandomJudgeResult = JudgeResult & {
  testCase?: {
    input: string;
    expected: string;
    actual: string;
  };
};

// Docker 客户端
const docker = new Docker({ socketPath: "/var/run/docker.sock" });

// 输入验证 Schema
const judgeSchema = z.object({
  problemId: z.string().min(1),
  language: z.enum([EditorLanguage.c, EditorLanguage.cpp]),
  code: z.string().min(10),
});

// 获取题目列表
export async function getProblems() {
  return prisma.problem.findMany({
    select: { id: true, title: true, difficulty: true },
    where: { published: true }
  });
}

// 获取题目详情
export async function getProblem(id: string) {
  return prisma.problem.findUniqueOrThrow({
    where: { id },
    include: {
      templates: true,
      ReferenceCode: true
    }
  });
}


// 主判题函数
export async function judge(formData: FormData): Promise<RandomJudgeResult> {
  const session = await auth();
  if (!session?.user) redirect("/sign-in");

  try {
    // 验证输入
    const { problemId, language, code } = judgeSchema.parse({
      problemId: formData.get("problemId"),
      language: formData.get("language"),
      code: formData.get("code"),
    });

    // 获取题目配置
    const [problem, reference] = await Promise.all([
      prisma.problem.findUniqueOrThrow({
        where: { id: problemId },
        include: { ReferenceCode: true },
      }),
      prisma.referenceCode.findUniqueOrThrow({
        where: {
          problemId_language: { problemId, language },
        },
      }),
    ]);

    // 生成测试用例
    const testCase = generateTestCase(reference.inputSchema as InputSchema);

    // 执行用户代码
    const userResult = await executeCode(
      language,
      code,
      problem,
      reference,
      testCase
    );

    // 执行参考代码
    const referenceResult = await executeCode(
      language,
      reference.code,
      problem,
      reference,
      testCase
    );

    // 验证结果
    const isValid = validateResult(
      reference.expectedOutput,
      testCase.input,
      userResult.output
    ) && (userResult.output === referenceResult.output);

    return {
      ...userResult,
      exitCode: isValid ? ExitCode.AC : ExitCode.WA,
      testCase: {
        input: JSON.stringify(testCase.input),
        expected: testCase.expected,
        actual: userResult.output,
      },
    };
  } catch (error) {
    return handleJudgeError(error);
  }
}

// Docker 环境准备
async function prepareEnvironment(image: string, tag: string) {
  const reference = `${image}:${tag}`;
  const images = await docker.listImages({ filters: { reference: [reference] } });
  if (images.length === 0) await docker.pull(reference);
}

// 执行代码通用流程
async function executeCode(
  language: EditorLanguage,
  code: string,
  problem: Problem & { ReferenceCode: ReferenceCode[] },
  reference: ReferenceCode,
  testCase: ReturnType<typeof generateTestCase>
): Promise<JudgeResult> {
  let container: Docker.Container | null = null;

  try {
    // 获取配置
    const config = await prisma.editorLanguageConfig.findUniqueOrThrow({
      where: { language },
      include: { dockerConfig: true },
    });

    // 准备 Docker 环境
    const { image, tag } = config.dockerConfig!;
    await prepareEnvironment(image, tag);

    // 创建容器
    container = await docker.createContainer({
      Image: `${image}:${tag}`,
      Cmd: ["tail", "-f", "/dev/null"],
      WorkingDir: config.dockerConfig!.workingDir,
      HostConfig: {
        Memory: config.dockerConfig!.memoryLimit * 1024 * 1024,
        MemorySwap: config.dockerConfig!.memoryLimit * 1024 * 1024,
        NetworkMode: "none",
      },
    });
    await container.start();

    // 构建测试代码
    const fullCode = buildTestCode(
      language,
      code,
      reference.testTemplate || "",
      testCase.input
    );

    // 上传代码
    const tarStream = createTarStream(`${config.fileName}.${config.fileExtension}`, fullCode);
    await container.putArchive(tarStream, { path: config.dockerConfig!.workingDir });

    // 编译运行
    const compileResult = await compileCode(container, config);
    if (compileResult.exitCode === ExitCode.CE) return compileResult;

    return await runCode(container, config);
  } finally {
    if (container) {
      await container.kill();
      await container.remove();
    }
  }
}

// 代码构建
function buildTestCode(
  language: EditorLanguage,
  code: string,
  template: string,
  input: any
): string {
  // 根据不同的语言处理测试用例
  switch (language) {
    case EditorLanguage.c:
    case EditorLanguage.cpp:
      return `
#include <stdio.h>
${code}

int main() {
  int input[] = {${input.join(",")}};
  ${template.replace("{{result}}", "result")}
  printf("%d", result);
  return 0;
}
      `;
    default:
      throw new Error("Unsupported language");
  }
}

// 编译逻辑
async function compileCode(
  container: Docker.Container,
  config: any
): Promise<JudgeResult> {
  const exec = await container.exec({
    Cmd: ["gcc", "-O2", `${config.fileName}.${config.fileExtension}`, "-o", config.fileName],
    AttachStdout: true,
    AttachStderr: true,
  });

  return new Promise((resolve) => {
    let output = "";
    exec.start({}, (err, stream) => {
      stream?.on("data", (chunk) => (output += chunk.toString()));
      stream?.on("end", async () => {
        const exitCode = (await exec.inspect()).ExitCode;
        resolve({
          id: uuid(),
          output: exitCode === 0 ? "Compilation Success" : output,
          exitCode: exitCode === 0 ? ExitCode.CS : ExitCode.CE,
          executionTime: null,
          memoryUsage: null,
        });
      });
    });
  });
}

// 运行逻辑
async function runCode(
  container: Docker.Container,
  config: any
): Promise<JudgeResult> {
  const exec = await container.exec({
    Cmd: [`./${config.fileName}`],
    AttachStdout: true,
    AttachStderr: true,
  });

  return new Promise((resolve) => {
    let output = "";
    const timeout = setTimeout(async () => {
      resolve({
        id: uuid(),
        output: "Time Limit Exceeded",
        exitCode: ExitCode.TLE,
        executionTime: null,
        memoryUsage: null,
      });
    }, config.dockerConfig!.timeLimit);

    exec.start({}, (err, stream) => {
      stream?.on("data", (chunk) => (output += chunk.toString()));
      stream?.on("end", async () => {
        clearTimeout(timeout);
        const exitCode = (await exec.inspect()).ExitCode;
        resolve({
          id: uuid(),
          output,
          exitCode: exitCode === 0 ? ExitCode.AC : ExitCode.RE,
          executionTime: null,
          memoryUsage: null,
        });
      });
    });
  });
}

// 工具函数
function createTarStream(filename: string, content: string): NodeJS.ReadableStream {
  const pack = tar.pack();
  pack.entry({ name: filename }, content);
  pack.finalize();
  return Readable.from(pack);
}

function generateTestCase(schema: InputSchema): { input: any; expected: string } {
  // 示例实现（需根据 inputSchema 扩展）
  const a = Math.floor(Math.random() * 100);
  const b = Math.floor(Math.random() * 100);
  return {
    input: [a, b],
    expected: (a + b).toString(),
  };
}

function validateResult(validationCode: string, input: any, output: string): boolean {
  try {
    if (/(process|require|import)/i.test(validationCode)) return false;
    return new Function("input", "output", `return ${validationCode}`)(input, output);
  } catch {
    return false;
  }
}

function handleJudgeError(error: unknown): RandomJudgeResult {
  const errorId = uuid();
  console.error(`[${errorId}] Judge Error:`, error);

  let message = "System Error";
  if (error instanceof z.ZodError) {
    message = "Invalid input: " + error.errors.map(e => e.message).join(", ");
  } else if (error instanceof Error) {
    message = error.message;
  }

  return {
    id: errorId,
    output: message,
    exitCode: ExitCode.SE,
    executionTime: null,
    memoryUsage: null,
  };
}
