
'use client';

import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Sidebar } from './sidebar';
import { Button } from '@/components/ui/button';
import { Menu, MessageSquare } from 'lucide-react';
import { useAuth } from './auth-provider';
import { cn } from '@/lib/utils';
import { BottomNavigation } from './bottom-navigation';
import { Header } from './header';


export function LayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const pathname = usePathname();

  if (!user) {
    return null;
  }

  return (
    <div className="relative flex min-h-screen w-full bg-muted/40">
      <Sidebar 
        user={user} 
        isCollapsed={isSidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className={cn(
        "flex flex-col flex-1 pb-20 md:pb-0 sidebar-transition",
        isSidebarCollapsed ? "md:ml-20" : "md:ml-64"
      )}>
        <Header />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <BottomNavigation />
    </div>
  );
}
