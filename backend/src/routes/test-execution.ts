import express, { Request, Response } from 'express';
import { executeTestCase } from '../services/test-executor.js';

const router = express.Router();

router.post('/:id/run', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    if (!id || typeof id !== 'string' || id.trim() === '') {
      return res.status(400).json({ error: '测试用例ID不能为空' });
    }

    const result = await executeTestCase(id);

    return res.status(200).json(result);
  } catch (error) {
    console.error('执行测试用例错误:', error);
    return res.status(500).json({
      error: '执行测试用例失败',
      details: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router;
