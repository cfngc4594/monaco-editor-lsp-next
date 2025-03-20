// prisma/seed.ts
import { PrismaClient, Role, Difficulty, EditorLanguage } from '@prisma/client';
import { createHash } from 'node:crypto';

const prisma = new PrismaClient();

// 密码哈希函数（演示用途）
function hashPassword(password: string): string {
  const salt = 'demo_static_salt'; // 生产环境应使用动态盐值
  return createHash('sha256')
    .update(password + salt)
    .digest('hex');
}

async function main() {
  // 清理顺序：从叶子节点到根节点
  await prisma.$transaction([
    prisma.referenceCode.deleteMany(),
    prisma.template.deleteMany(),
    prisma.judgeResult.deleteMany(),
    prisma.problem.deleteMany(),
    prisma.user.deleteMany(),
    prisma.dockerConfig.deleteMany(),
    prisma.editorLanguageConfig.deleteMany(),
  ]);

  // 创建语言配置
  await prisma.editorLanguageConfig.createMany({
    data: [
      {
        language: EditorLanguage.c,
        label: 'C 语言',
        fileName: 'main.c',
        fileExtension: '.c'
      },
      {
        language: EditorLanguage.cpp,
        label: 'C++',
        fileName: 'main.cpp',
        fileExtension: '.cpp'
      }
    ]
  });

  // 创建 Docker 配置
  await prisma.dockerConfig.createMany({
    data: [
      {
        language: EditorLanguage.c,
        image: 'gcc',
        tag: 'latest',
        workingDir: '/app',
        timeLimit: 5000,
        memoryLimit: 256,
        compileOutputLimit: 1024,
        runOutputLimit: 4096
      },
      {
        language: EditorLanguage.cpp,
        image: 'gcc',
        tag: 'latest',
        workingDir: '/app',
        timeLimit: 5000,
        memoryLimit: 256,
        compileOutputLimit: 1024,
        runOutputLimit: 4096
      }
    ]
  });

  // 创建测试用户
  const admin = await prisma.user.create({
    data: {
      name: '系统管理员',
      email: 'admin@code.com',
      password: "$2b$10$edWXpq2TOiiGQkPOXWKGlO4EKnp2YyV7OoS2qqk/W0E6GyiVQIC66",
      role: Role.ADMIN,
      emailVerified: new Date()
    }
  });

  const teacher = await prisma.user.create({
    data: {
      name: '王老师',
      email: 'wang@code.com',
      password: hashPassword('teacher123'),
      role: Role.TEACHER,
      emailVerified: new Date()
    }
  });

  // 创建题目（不包含关联数据）
  const problem1 = await prisma.problem.create({
    data: {
      title: '两数相加',
      description: '编写一个函数计算两个整数的和',
      solution: '直接返回 a + b 即可',
      difficulty: Difficulty.EASY,
      published: true,
      userId: teacher.id
    }
  });

  // 创建题目模板
  await prisma.template.createMany({
    data: [
      {
        problemId: problem1.id,
        language: EditorLanguage.c,
        template: 'int add(int a, int b) { return a + b; }'
      },
      {
        problemId: problem1.id,
        language: EditorLanguage.cpp,
        template: 'int add(int a, int b) { return a + b; }'
      }
    ]
  });

  // 创建参考代码
  await prisma.referenceCode.create({
    data: {
      problemId: problem1.id,
      language: EditorLanguage.c,
      code: 'int add(int a, int b) { return a + b; }',
      inputSchema: {
        type: 'array',
        items: {
          type: 'integer',
          min: 0,
          max: 100
        },
        minItems: 2,
        maxItems: 2
      },
      testTemplate: 'int result = add(input[0], input[1]);',
      expectedOutput: 'input[0] + input[1]'
    }
  });

  console.log('✅ 种子数据创建成功');
  console.log(`管理员账号: ${admin.email} / admin123`);
  console.log(`教师账号: ${teacher.email} / teacher123`);
}

main()
  .catch((e) => {
    console.error('❌ 种子数据创建失败:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
