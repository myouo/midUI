import express, { Request, Response } from 'express';
import fs from 'fs/promises';
import path from 'path';
import {
  ModelConfig,
  validateModelConfig
} from '../models/model-config.js';

const router = express.Router();

const PROJECT_ROOT = path.join(process.cwd(), '..');
const CONFIG_DIR = path.join(PROJECT_ROOT, 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'model-config.json');

async function ensureConfigDir() {
  try {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  } catch (error) {
    throw new Error(`无法创建配置目录: ${error}`);
  }
}

async function readConfigFile(): Promise<ModelConfig | null> {
  try {
    const content = await fs.readFile(CONFIG_FILE, 'utf-8');
    return JSON.parse(content) as ModelConfig;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw new Error(`读取配置文件失败: ${error}`);
  }
}

async function getConfigFromEnv(): Promise<ModelConfig | null> {
  const apiKey = process.env.MIDSCENE_MODEL_API_KEY;
  const baseUrl = process.env.MIDSCENE_MODEL_BASE_URL;
  const modelName = process.env.MIDSCENE_MODEL_NAME;

  if (!apiKey && !baseUrl && !modelName) {
    return null;
  }

  return {
    apiKey: apiKey || '',
    baseUrl: baseUrl || '',
    modelName: modelName || '',
    modelFamily: 'openai'
  };
}

router.get('/model', async (req: Request, res: Response) => {
  try {
    const config = await readConfigFile();

    if (config) {
      return res.status(200).json(config);
    }

    const envConfig = await getConfigFromEnv();

    if (envConfig) {
      return res.status(200).json(envConfig);
    }

    return res.status(404).json({ error: '未找到配置，请先设置配置或环境变量' });
  } catch (error) {
    console.error('获取模型配置错误:', error);
    return res.status(500).json({ error: '获取模型配置失败' });
  }
});

router.put('/model', async (req: Request, res: Response) => {
  try {
    const { apiKey, baseUrl, modelName, modelFamily } = req.body;

    const validationError = validateModelConfig({ apiKey, baseUrl, modelName });
    if (validationError) {
      return res.status(400).json({ error: validationError });
    }

    await ensureConfigDir();

    const existingConfig = await readConfigFile();
    const now = new Date().toISOString();

    const newConfig: ModelConfig = {
      apiKey: apiKey.trim(),
      baseUrl: baseUrl.trim(),
      modelName: modelName.trim(),
      modelFamily: modelFamily || 'openai',
      updatedAt: now
    };

    await fs.writeFile(CONFIG_FILE, JSON.stringify(newConfig, null, 2), 'utf-8');

    return res.status(200).json(newConfig);
  } catch (error) {
    console.error('更新模型配置错误:', error);
    return res.status(500).json({ error: '更新模型配置失败' });
  }
});

export default router;
