import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

interface ModelConfig {
  apiKey: string;
  baseUrl: string;
  modelName: string;
  modelFamily?: string;
}

export const ModelConfig = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<ModelConfig>({
    apiKey: '',
    baseUrl: '',
    modelName: '',
    modelFamily: 'openai',
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/config/model');
        
        if (response.status === 404) {
          setMessage({ type: 'error', text: '未找到配置，请创建新配置' });
          return;
        }
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        setConfig({
          apiKey: data.apiKey || '',
          baseUrl: data.baseUrl || '',
          modelName: data.modelName || '',
          modelFamily: data.modelFamily || 'openai',
        });
      } catch (error) {
        console.error('加载配置失败:', error);
        setMessage({ type: 'error', text: '加载配置失败，请查看控制台' });
      }
    };

    loadConfig();
  }, []);

  const handleSave = async () => {
    if (!config.apiKey.trim()) {
      setMessage({ type: 'error', text: 'API Key不能为空' });
      return;
    }
    
    if (!config.baseUrl.trim()) {
      setMessage({ type: 'error', text: 'Base URL不能为空' });
      return;
    }
    
    if (!config.modelName.trim()) {
      setMessage({ type: 'error', text: 'Model Name不能为空' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const response = await fetch('http://localhost:3001/api/config/model', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: config.apiKey.trim(),
          baseUrl: config.baseUrl.trim(),
          modelName: config.modelName.trim(),
          modelFamily: config.modelFamily || 'openai',
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '保存失败');
      }

      setMessage({ type: 'success', text: '保存成功' });
      
      setTimeout(() => {
        navigate('/');
      }, 1500);
    } catch (error) {
      console.error('保存配置失败:', error);
      setMessage({ 
        type: 'error', 
        text: error instanceof Error ? error.message : '保存失败，请查看控制台' 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 p-8">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-xl p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-slate-800 mb-2">
            AI模型配置
          </h1>
          <p className="text-slate-600">
            配置midscene.js使用的AI模型参数
          </p>
          <a
            href="https://midscenejs.com/model-common-config"
            target="_blank"
            rel="noopener noreferrer"
            className="text-indigo-600 hover:text-indigo-700 text-sm underline mt-2 inline-block"
          >
            查看midscene.js文档 →
          </a>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-lg border ${
              message.type === 'success'
                ? 'bg-green-50 border-green-200 text-green-800'
                : 'bg-red-50 border-red-200 text-red-800'
            }`}
          >
            {message.type === 'success' ? '✓ ' : '✗ '}
            {message.text}
          </div>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              API Key <span className="text-red-500">*</span>
            </label>
            <input
              type="password"
              value={config.apiKey}
              onChange={(e) => setConfig({ ...config, apiKey: e.target.value })}
              placeholder="sk-..."
              className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Base URL <span className="text-red-500">*</span>
            </label>
            <input
              type="url"
              value={config.baseUrl}
              onChange={(e) => setConfig({ ...config, baseUrl: e.target.value })}
              placeholder="https://api.openai.com/v1"
              className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Model Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={config.modelName}
              onChange={(e) => setConfig({ ...config, modelName: e.target.value })}
              placeholder="gpt-4"
              className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Model Family
            </label>
            <select
              value={config.modelFamily}
              onChange={(e) => setConfig({ ...config, modelFamily: e.target.value })}
              className="w-full px-4 py-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
            >
              <option value="openai">OpenAI</option>
              <option value="qwen">Qwen</option>
              <option value="gemini">Gemini</option>
              <option value="claude">Claude</option>
            </select>
          </div>
        </div>

        <div className="flex gap-4 mt-8">
          <button
            onClick={handleSave}
            disabled={loading}
            className={`
              flex-1 px-6 py-3 text-white font-medium rounded-lg shadow-md
              ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}
            `}
          >
            {loading ? '保存中...' : '保存配置'}
          </button>
          <button
            onClick={() => navigate('/')}
            disabled={loading}
            className="flex-1 px-6 py-3 bg-slate-200 text-slate-700 font-medium rounded-lg hover:bg-slate-300"
          >
            返回
          </button>
        </div>
      </div>
    </div>
  );
};
