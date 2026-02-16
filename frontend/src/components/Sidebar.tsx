import React from 'react';
import { Header } from './Header';
import { TestCaseList } from './TestCaseList';

/**
 * 左侧边栏组件
 * 固定宽度280px，包含测试用例列表
 * 应用毛玻璃效果
 */
export const Sidebar: React.FC = () => {
  return (
    <aside className="w-[280px] h-full flex flex-col bg-slate-50/30 border-r border-white/20 backdrop-blur-xl">
      <Header />
      <TestCaseList />
    </aside>
  );
};

export default Sidebar;
