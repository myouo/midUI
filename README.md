# midUI - 可视化浏览器自动化测试工具

一个无需编写代码的可视化浏览器自动化测试工具，通过拖拽节点构建基于 midscene.js 的测试用例，实现零代码完成浏览器自动化测试。

我的修改

## 1. 功能概述

midUI 是一个可视化浏览器自动化测试平台，具有以下核心能力：

- **无代码测试构建**：通过拖拽可视化节点，无需编写代码即可创建自动化测试用例
- **AI 驱动的元素交互**：利用 AI 模型自动识别和操作页面元素，简化测试编写
- **一键测试执行**：快速运行测试用例并查看执行结果
- **可视化报告**：自动生成 HTML 测试报告，便于分析测试结果

## 2. 快速启动

### 前置要求

- Node.js 18+
- npm 或 yarn
- 支持视觉的模型API

### 安装步骤

```bash
# 进入项目目录
cd midUI

# 安装前端依赖
cd frontend
npm install

# 安装后端依赖
cd ../backend
npm install

# 安装 Playwright 浏览器
npx playwright install chromium
```

### midscene.js模型配置

模型配置会保存到 `config/model-config.json` 文件中。
可以在启动项目前优先配置midscene使用模型,已预配置好使用qwen-vl-max的模板。

### 启动项目

```bash
# 终端1：启动后端（端口3001）
cd backend
npm run dev

# 终端2：启动前端（端口3000）
cd frontend
npm run dev
```




访问 http://localhost:3000

## 3. 用户自主配置项

### AI 模型配置

首次使用前，需要配置 AI 模型以支持智能元素识别。访问配置页面：http://localhost:3000/config/model

#### 配置参数说明

| 参数 | 说明 | 示例值 |
|-----|------|-------|
| apiKey | AI 服务的 API 密钥 | sk-xxxxx |
| baseUrl | API 基础地址 | https://dashscope.aliyuncs.com/compatible-mode/v1 |
| modelName | 模型名称 | qwen-vl-max |
| modelFamily | 模型家族 | qwen / openai / gemini / claude |

#### 配置文件位置

模型配置会保存到 `config/model-config.json` 文件中。
可以在启动项目前优先配置midscene使用模型。

#### 支持的模型家族

- **Qwen** (阿里云) - 推荐国内使用
- **OpenAI**
- **Gemini** (Google)
- **Claude** (Anthropic)

## 4. 项目详细功能与技术实现

### 项目结构

```
midUI/
├── frontend/              # React前端应用（端口3000）
│   ├── src/
│   │   ├── components/   # UI组件
│   │   │   ├── FlowCanvas.tsx      # React Flow画布
│   │   │   ├── NodeToolbar.tsx    # 节点工具栏
│   │   │   ├── TestCaseList.tsx   # 测试用例列表
│   │   │   ├── RunTestButton.tsx  # 测试执行按钮
│   │   │   └── nodes/             # 5种节点组件
│   │   ├── store/                # Zustand状态管理
│   │   ├── api/                  # API调用模块
│   │   └── pages/                # 页面组件
│
└── backend/               # Node.js后端API（端口3001）
    ├── src/
    │   ├── routes/       # Express路由
    │   ├── services/     # 业务服务
    │   └── models/       # 数据模型
    └── midscene_run/    # 测试执行输出
```

### 核心功能

#### 4.1 节点类型

| 节点类型 | 颜色 | 说明 | 必填参数 |
|---------|------|------|----------|
| aiTap | 蓝色 | 点击元素 | target |
| aiInput | 绿色 | 输入文本 | target, value |
| aiWaitFor | 黄色 | 等待元素 | target, timeout |
| aiAssert | 红色 | 断言元素 | target, value |
| aiNavigate | 紫色 | 导航到URL | url |

#### 4.2 测试用例管理

- 创建、编辑、删除测试用例
- 每个用例包含 baseUrl 和节点列表
- 测试用例持久化存储为 JSON 文件

#### 4.3 测试执行

- 按节点 Y 坐标顺序执行（无需手动连线）
- 实时显示执行状态：空闲 → 执行中 → 成功/失败
- 自动生成 HTML 测试报告
- 记录执行时长和错误信息

### 技术栈

#### 前端
- React 19 + TypeScript
- Vite (构建工具)
- React Flow (@xyflow/react) - 可视化流程图
- Tailwind CSS + shadcn/ui - UI 组件库
- Zustand - 轻量级状态管理

#### 后端
- Node.js + Express
- midscene.js - AI 驱动的浏览器自动化
- Playwright - 浏览器控制
- TypeScript

### API 端点

| 方法 | 路径 | 说明 |
|-----|------|------|
| GET | /api/health | 健康检查 |
| GET | /api/test-cases | 获取所有测试用例 |
| POST | /api/test-cases | 创建测试用例 |
| GET | /api/test-cases/:id | 获取单个用例 |
| PUT | /api/test-cases/:id | 更新用例 |
| DELETE | /api/test-cases/:id | 删除用例 |
| POST | /api/test-cases/:id/run | 执行测试 |
| GET | /api/config/model | 获取模型配置 |
| PUT | /api/config/model | 更新模型配置 |

### 使用流程

1. **配置 AI 模型**
   - 访问 http://localhost:3000/config/model
   - 填写 API Key、Base URL、Model Name
   - 选择 Model Family
   - 点击"保存配置"

2. **创建测试用例**
   - 左侧用例列表点击"新建用例"
   - 设置 baseUrl（如：https://www.baidu.com）
   - 保存

3. **构建测试流程**
   - 从工具栏拖拽节点到画布
   - 点击节点填写参数
   - 调整节点位置（按 Y 坐标排序）
   - 保存

4. **执行测试**
   - 点击"运行测试"按钮
   - 查看执行结果和报告

### 开发命令

```bash
# 前端开发 (热重载)
cd frontend
npm run dev

# 后端开发 (热重载)
cd backend
npm run dev

# 构建前端
cd frontend
npm run build

# 构建后端
cd backend
npm run build
```

## 许可证

MIT
