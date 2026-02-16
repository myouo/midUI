import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import { StepsList } from './components/StepsList'
import { ModelConfig } from './pages/ModelConfig'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={
          <Layout>
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-slate-700 mb-2">
                  可视化浏览器自动化测试工具
                </h2>
                <p className="text-slate-500">
                  从左侧选择或创建测试用例
                </p>
              </div>
            </div>
          </Layout>
        } />
        <Route path="/flow" element={
          <Layout>
            <StepsList />
          </Layout>
        } />
        <Route path="/config/model" element={
          <Layout>
            <ModelConfig />
          </Layout>
        } />
      </Routes>
    </BrowserRouter>
  )
}

export default App
