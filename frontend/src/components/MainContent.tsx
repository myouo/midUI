import React from 'react';
import type { ReactNode } from 'react';

interface MainContentProps {
  children: ReactNode;
}

export const MainContent: React.FC<MainContentProps> = ({ children }) => {
  return (
    <main className="flex-1 min-w-0 h-full bg-slate-100 p-6">
      <div className="w-full h-full">
        {children}
      </div>
    </main>
  );
};

export default MainContent;
