import { chromium, Browser, Page, BrowserContext } from 'playwright';
import { PlaywrightAgent } from '@midscene/web/playwright';
import fs from 'fs/promises';
import path from 'path';
import { TestCase, TestCaseStep } from '../models/test-case.js';
import { ModelConfig } from '../models/model-config.js';

interface TestExecutionResult {
  status: 'passed' | 'failed';
  testCaseId: string;
  duration: number;
  error?: string;
  midsceneReportDir?: string;
  executedSteps: Array<{
    stepId: string;
    stepType: string;
    status: 'passed' | 'failed';
    duration: number;
    error?: string;
  }>;
}

const PROJECT_ROOT = path.join(process.cwd(), '..');
const REPORTS_DIR = path.join(PROJECT_ROOT, 'reports');
const CONFIG_DIR = path.join(PROJECT_ROOT, 'config');
const CONFIG_FILE = path.join(CONFIG_DIR, 'model-config.json');
const TEST_CASES_DIR = path.join(process.cwd(), 'test-cases');

async function ensureReportsDir() {
  try {
    await fs.mkdir(REPORTS_DIR, { recursive: true });
  } catch (error) {
    throw new Error(`无法创建报告目录: ${error}`);
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

async function executeStep(
  agent: PlaywrightAgent,
  page: Page,
  step: TestCaseStep
): Promise<{ duration: number; error?: string }> {
  const startTime = Date.now();
  const { type, params } = step;

  try {
    switch (type) {
      case 'aiTap':
        await agent.aiTap(params.target || '');
        break;

      case 'aiInput':
        await agent.aiInput(params.value || '', params.target || '');
        break;

      case 'aiWaitFor':
        await agent.aiWaitFor(params.target || '', { timeoutMs: 10000 });
        break;

      case 'aiAssert':
        await agent.aiAssert(params.value || params.target || '');
        break;

      case 'aiNavigate':
        await page.goto(params.url || '');
        break;

      default:
        throw new Error(`未知的节点类型: ${type}`);
    }

    return { duration: Date.now() - startTime };
  } catch (error) {
    return {
      duration: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function executeTestCase(testCaseId: string): Promise<TestExecutionResult> {
  const startTime = Date.now();
  let browser: Browser | null = null;
  let context: BrowserContext | null = null;
  let page: Page | null = null;

  try {
    await ensureReportsDir();

    const testCase = await readTestCase(testCaseId);
    if (!testCase) {
      throw new Error(`测试用例不存在: ${testCaseId}`);
    }

    const modelConfig = await readConfigFile();
    if (!modelConfig) {
      throw new Error('未找到模型配置，请先配置AI模型');
    }

    const sortedSteps = testCase.steps;

    const executedSteps: TestExecutionResult['executedSteps'] = [];

    browser = await chromium.launch({ headless: false });
    context = await browser.newContext({
      viewport: { width: 1280, height: 768 }
    });
    page = await context.newPage();

    const isQwenModel = modelConfig.modelFamily?.toLowerCase() === 'qwen' || 
                        modelConfig.modelName?.toLowerCase().includes('qwen');
    
    process.env.MIDSCENE_MODEL_API_KEY = modelConfig.apiKey;
    process.env.MIDSCENE_MODEL_BASE_URL = modelConfig.baseUrl;
    process.env.MIDSCENE_MODEL_NAME = modelConfig.modelName;
    
    if (isQwenModel) {
      process.env.MIDSCENE_USE_QWEN_VL = '1';
      delete process.env.MIDSCENE_MODEL_FAMILY;
    } else {
      process.env.MIDSCENE_USE_QWEN_VL = '0';
      process.env.MIDSCENE_MODEL_FAMILY = modelConfig.modelFamily || 'openai';
    }

    console.log('Environment variables set:');
    console.log('MIDSCENE_MODEL_API_KEY:', modelConfig.apiKey ? '***SET***' : 'NOT SET');
    console.log('MIDSCENE_MODEL_BASE_URL:', modelConfig.baseUrl);
    console.log('MIDSCENE_MODEL_NAME:', modelConfig.modelName);
    console.log('MIDSCENE_MODEL_FAMILY:', process.env.MIDSCENE_MODEL_FAMILY || '(not set for qwen)');
    console.log('MIDSCENE_USE_QWEN_VL:', process.env.MIDSCENE_USE_QWEN_VL);

    await page.goto(testCase.baseUrl);

    console.log('Model config from file:', JSON.stringify(modelConfig));

    const agentModelConfig: Record<string, string> = {
      MIDSCENE_MODEL_API_KEY: modelConfig.apiKey,
      MIDSCENE_MODEL_BASE_URL: modelConfig.baseUrl,
      MIDSCENE_MODEL_NAME: modelConfig.modelName,
      MIDSCENE_USE_QWEN_VL: process.env.MIDSCENE_USE_QWEN_VL || '0'
    };
    
    if (!isQwenModel) {
      agentModelConfig.MIDSCENE_MODEL_FAMILY = modelConfig.modelFamily || 'openai';
    }

    console.log('Agent model config:', JSON.stringify(agentModelConfig));
    console.log('PlaywrightAgent will use config from env vars');

    const agent = new PlaywrightAgent(page, {
      modelConfig: agentModelConfig,
      outputMode: 'console',
      report: {
        outputFormat: 'html-and-external-assets',
      },
    });

    for (const step of sortedSteps) {
      const result = await executeStep(agent, page, step);

      executedSteps.push({
        stepId: step.id,
        stepType: step.type,
        status: result.error ? 'failed' : 'passed',
        duration: result.duration,
        error: result.error
      });

      if (result.error) {
        throw new Error(`节点执行失败 [${step.type}]: ${result.error}`);
      }
    }

    const midsceneReportDir = path.join(process.cwd(), 'midscene_run', 'report');
    
    return {
      status: 'passed',
      testCaseId,
      duration: Date.now() - startTime,
      midsceneReportDir,
      executedSteps
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      status: 'failed',
      testCaseId,
      duration: Date.now() - startTime,
      error: errorMessage,
      executedSteps: []
    };
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    if (browser) await browser.close().catch(() => {});
  }
}

async function generateHtmlReport(
  testCase: TestCase,
  executedSteps: TestExecutionResult['executedSteps'],
  reportPath: string
): Promise<void> {
  const timestamp = new Date().toLocaleString('zh-CN');
  const totalDuration = executedSteps.reduce((sum, step) => sum + step.duration, 0);
  const failedCount = executedSteps.filter(step => step.status === 'failed').length;
  const overallStatus = failedCount > 0 ? 'failed' : 'passed';

  const html = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>测试报告 - ${testCase.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: 40px 20px;
      min-height: 100vh;
    }

    .container {
      max-width: 900px;
      margin: 0 auto;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      border-radius: 20px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 30px 40px;
    }

    .header h1 {
      font-size: 28px;
      margin-bottom: 10px;
      font-weight: 600;
    }

    .header .timestamp {
      opacity: 0.9;
      font-size: 14px;
    }

    .status-badge {
      display: inline-block;
      padding: 6px 16px;
      border-radius: 20px;
      font-size: 14px;
      font-weight: 600;
      margin-top: 15px;
    }

    .status-passed {
      background: rgba(34, 197, 94, 0.2);
      color: #22c55e;
      border: 1px solid #22c55e;
    }

    .status-failed {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      border: 1px solid #ef4444;
    }

    .summary {
      padding: 30px 40px;
      border-bottom: 1px solid #e5e7eb;
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 20px;
    }

    .summary-item {
      text-align: center;
    }

    .summary-item .label {
      color: #6b7280;
      font-size: 12px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 5px;
    }

    .summary-item .value {
      color: #1f2937;
      font-size: 24px;
      font-weight: 600;
    }

    .info-section {
      padding: 30px 40px;
      border-bottom: 1px solid #e5e7eb;
    }

    .info-section h2 {
      font-size: 18px;
      margin-bottom: 15px;
      color: #1f2937;
      font-weight: 600;
    }

    .info-row {
      display: flex;
      margin-bottom: 10px;
    }

    .info-row .label {
      width: 100px;
      color: #6b7280;
      font-size: 14px;
    }

    .info-row .value {
      flex: 1;
      color: #1f2937;
      font-size: 14px;
      word-break: break-all;
    }

    .steps-section {
      padding: 30px 40px;
    }

    .steps-section h2 {
      font-size: 18px;
      margin-bottom: 20px;
      color: #1f2937;
      font-weight: 600;
    }

    .step {
      display: flex;
      align-items: center;
      padding: 15px 20px;
      margin-bottom: 10px;
      border-radius: 10px;
      background: #f9fafb;
      border: 1px solid #e5e7eb;
    }

    .step.passed {
      background: rgba(34, 197, 94, 0.05);
      border-color: #22c55e;
    }

    .step.failed {
      background: rgba(239, 68, 68, 0.05);
      border-color: #ef4444;
    }

    .step-icon {
      width: 24px;
      height: 24px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 15px;
      font-size: 12px;
      font-weight: 600;
    }

    .step.passed .step-icon {
      background: #22c55e;
      color: white;
    }

    .step.failed .step-icon {
      background: #ef4444;
      color: white;
    }

    .step-content {
      flex: 1;
    }

    .step-type {
      font-weight: 600;
      color: #1f2937;
      font-size: 14px;
      margin-bottom: 4px;
    }

    .step-params {
      color: #6b7280;
      font-size: 12px;
    }

    .step-duration {
      color: #9ca3af;
      font-size: 12px;
      margin-left: 15px;
    }

    .step-error {
      margin-top: 8px;
      padding: 8px 12px;
      background: rgba(239, 68, 68, 0.1);
      border-radius: 6px;
      color: #dc2626;
      font-size: 12px;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>测试报告</h1>
      <div class="timestamp">${timestamp}</div>
      <div class="status-badge status-${overallStatus}">
        ${overallStatus === 'passed' ? '✓ 通过' : '✗ 失败'}
      </div>
    </div>

    <div class="summary">
      <div class="summary-item">
        <div class="label">总步骤数</div>
        <div class="value">${executedSteps.length}</div>
      </div>
      <div class="summary-item">
        <div class="label">通过</div>
        <div class="value" style="color: #22c55e">${executedSteps.length - failedCount}</div>
      </div>
      <div class="summary-item">
        <div class="label">失败</div>
        <div class="value" style="color: #ef4444">${failedCount}</div>
      </div>
    </div>

    <div class="info-section">
      <h2>测试用例信息</h2>
      <div class="info-row">
        <div class="label">用例名称</div>
        <div class="value">${testCase.name}</div>
      </div>
      <div class="info-row">
        <div class="label">用例ID</div>
        <div class="value">${testCase.id}</div>
      </div>
      <div class="info-row">
        <div class="label">基础URL</div>
        <div class="value">${testCase.baseUrl}</div>
      </div>
      <div class="info-row">
        <div class="label">总耗时</div>
        <div class="value">${(totalDuration / 1000).toFixed(2)} 秒</div>
      </div>
    </div>

    <div class="steps-section">
      <h2>执行步骤</h2>
      ${executedSteps.map((step, index) => `
        <div class="step ${step.status}">
          <div class="step-icon">${step.status === 'passed' ? '✓' : '✗'}</div>
          <div class="step-content">
            <div class="step-type">${step.stepType}</div>
            <div class="step-params">步骤 #${index + 1}</div>
            <div class="step-duration">${(step.duration / 1000).toFixed(2)}s</div>
            ${step.error ? `<div class="step-error">${step.error}</div>` : ''}
          </div>
        </div>
      `).join('')}
    </div>
  </div>
</body>
</html>`;

  await fs.writeFile(reportPath, html, 'utf-8');
}
