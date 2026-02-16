/**
 * AI模型配置数据模型
 */

/**
 * AI模型配置接口
 */
export interface ModelConfig {
  /** API密钥（必填） */
  apiKey: string;
  /** API基础URL（必填） */
  baseUrl: string;
  /** 模型名称（必填） */
  modelName: string;
  /** 模型族（可选，默认"openai"） */
  modelFamily?: string;
  /** 最后更新时间戳 */
  updatedAt?: string;
}

/**
 * 创建模型配置的输入接口
 */
export interface CreateModelConfigInput {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  modelFamily?: string;
}

/**
 * 更新模型配置的输入接口（所有字段可选）
 */
export interface UpdateModelConfigInput {
  apiKey?: string;
  baseUrl?: string;
  modelName?: string;
  modelFamily?: string;
}

/**
 * 验证模型配置
 */
export function validateModelConfig(config: Partial<ModelConfig>): string | null {
  if (!config.apiKey || config.apiKey.trim() === '') {
    return 'apiKey is required';
  }
  if (!config.baseUrl || config.baseUrl.trim() === '') {
    return 'baseUrl is required';
  }
  if (!config.modelName || config.modelName.trim() === '') {
    return 'modelName is required';
  }
  return null;
}
