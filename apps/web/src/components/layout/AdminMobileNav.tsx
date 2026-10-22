import React from 'react';
import { LayoutDashboard, Calendar, UserCheck, Package, MoreHorizontal } from 'lucide-react';

interface AdminMobileNavProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function AdminMobileNav({ currentPath, onNavigate }: AdminMobileNavProps) {
  const quickItems = [
    { label: 'Dash', path: '/admin', icon: LayoutDashboard },
    { label: 'Trips', path: '/admin/trips', icon: Calendar },
    { label: 'Check-In', path: '/admin/check-in', icon: UserCheck },
    { label: 'Parcels', path: '/admin/parcels', icon: Package },
    { label: 'More', path: '/admin/reports', icon: MoreHorizontal },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border text-card-foreground z-50 px-2 py-1 flex items-center justify-around shadow-lg">
      {quickItems.map((item) => {
        const Icon = item.icon;
        const isActive = currentPath === item.path;
        return (
          <button
            key={item.path}
            type="button"
            onClick={() => onNavigate(item.path)}
            className={`flex flex-col items-center justify-center min-h-[48px] min-w-[48px] py-1 px-2 rounded ${
              isActive ? 'text-primary font-bold' : 'text-muted-foreground'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="text-[10px] mt-0.5">{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
