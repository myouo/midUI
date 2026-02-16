import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import {
  TestCase,
  CreateTestCaseInput,
  UpdateTestCaseInput
} from '../models/test-case.js';

const router = express.Router();

const TEST_CASES_DIR = path.join(process.cwd(), 'test-cases');

async function ensureDir() {
  try {
    await fs.mkdir(TEST_CASES_DIR, { recursive: true });
  } catch (error) {
    throw new Error(`无法创建测试用例目录: ${error}`);
  }
}

async function readTestCase(id: string): Promise<TestCase | null> {
  try {
    const filePath = path.join(TEST_CASES_DIR, `${id}.json`);
    const content = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(content) as TestCase;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw new Error(`读取测试用例失败: ${error}`);
  }
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const { name, baseUrl, steps = [] }: CreateTestCaseInput = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }

    if (!baseUrl || typeof baseUrl !== 'string' || baseUrl.trim() === '') {
      return res.status(400).json({ error: 'baseUrl is required' });
    }

    await ensureDir();

    const id = uuidv4();
    const now = new Date().toISOString();

    const testCase: TestCase = {
      id,
      name: name.trim(),
      baseUrl: baseUrl.trim(),
      createdAt: now,
      updatedAt: now,
      steps
    };

    const filePath = path.join(TEST_CASES_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(testCase, null, 2), 'utf-8');

    return res.status(201).json(testCase);
  } catch (error) {
    console.error('创建测试用例错误:', error);
    return res.status(500).json({ error: '创建测试用例失败' });
  }
});

router.get('/', async (req: Request, res: Response) => {
  try {
    await ensureDir();

    const files = await fs.readdir(TEST_CASES_DIR);
    const testCases: TestCase[] = [];

    for (const file of files) {
      if (file.endsWith('.json')) {
        const filePath = path.join(TEST_CASES_DIR, file);
        const content = await fs.readFile(filePath, 'utf-8');
        const testCase = JSON.parse(content) as TestCase;
        testCases.push(testCase);
      }
    }

    return res.status(200).json(testCases);
  } catch (error) {
    console.error('获取测试用例列表错误:', error);
    return res.status(500).json({ error: '获取测试用例列表失败' });
  }
});

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const testCase = await readTestCase(id);

    if (!testCase) {
      return res.status(404).json({ error: '测试用例不存在' });
    }

    return res.status(200).json(testCase);
  } catch (error) {
    console.error('获取测试用例错误:', error);
    return res.status(500).json({ error: '获取测试用例失败' });
  }
});

router.put('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, baseUrl, steps }: UpdateTestCaseInput = req.body;

    const existingTestCase = await readTestCase(id);

    if (!existingTestCase) {
      return res.status(404).json({ error: '测试用例不存在' });
    }

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ error: 'name不能为空' });
      }
      existingTestCase.name = name.trim();
    }

    if (baseUrl !== undefined) {
      if (typeof baseUrl !== 'string' || baseUrl.trim() === '') {
        return res.status(400).json({ error: 'baseUrl不能为空' });
      }
      existingTestCase.baseUrl = baseUrl.trim();
    }

    if (steps !== undefined) {
      existingTestCase.steps = steps;
    }

    existingTestCase.updatedAt = new Date().toISOString();

    const filePath = path.join(TEST_CASES_DIR, `${id}.json`);
    await fs.writeFile(filePath, JSON.stringify(existingTestCase, null, 2), 'utf-8');

    return res.status(200).json(existingTestCase);
  } catch (error) {
    console.error('更新测试用例错误:', error);
    return res.status(500).json({ error: '更新测试用例失败' });
  }
});

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const testCase = await readTestCase(id);

    if (!testCase) {
      return res.status(404).json({ error: '测试用例不存在' });
    }

    const filePath = path.join(TEST_CASES_DIR, `${id}.json`);
    await fs.unlink(filePath);

    return res.status(200).json({ message: '测试用例已删除' });
  } catch (error) {
    console.error('删除测试用例错误:', error);
    return res.status(500).json({ error: '删除测试用例失败' });
  }
});

export default router;
