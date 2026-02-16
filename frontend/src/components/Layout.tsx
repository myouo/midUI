import React from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { MainContent } from './MainContent';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="flex h-screen w-full bg-slate-200 overflow-hidden">
      <Sidebar />
      <MainContent>
        {children}
      </MainContent>
    </div>
  );
};

export default Layout;
