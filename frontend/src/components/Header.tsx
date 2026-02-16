import React from 'react';
import { Link } from 'react-router-dom';

export const Header: React.FC = () => {
  return (
    <header className="h-16 flex items-center justify-between px-6 border-b border-white/10 bg-white/30">
      <h1 className="text-xl font-bold text-slate-800 tracking-tight">测试用例</h1>
      <Link
        to="/config/model"
        className="px-4 py-2 text-sm font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 rounded-lg"
      >
        AI模型配置
      </Link>
    </header>
  );
};

export default Header;
