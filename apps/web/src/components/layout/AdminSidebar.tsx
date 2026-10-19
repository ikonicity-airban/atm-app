import React from 'react';
import {
  LayoutDashboard,
  Calendar,
  Ticket,
  UserCheck,
  Package,
  Users,
  MessageSquare,
  FileQuestion,
  CircleDollarSign,
  Truck,
  MapPin,
  BarChart3,
  Settings,
  ArrowLeft,
} from 'lucide-react';
import { BRAND } from '@atm/shared';

interface AdminSidebarProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export function AdminSidebar({ currentPath, onNavigate }: AdminSidebarProps) {
  const navSections = [
    {
      title: 'Operations',
      items: [
        { label: 'Dashboard', path: '/admin', icon: LayoutDashboard },
        { label: 'Trips & Dispatch', path: '/admin/trips', icon: Calendar },
        { label: 'Bookings', path: '/admin/bookings', icon: Ticket },
        { label: 'Passenger Check-In', path: '/admin/check-in', icon: UserCheck },
        { label: 'Parcels & Courier', path: '/admin/parcels', icon: Package },
      ],
    },
    {
      title: 'CRM & Requests',
      items: [
        { label: 'Customers', path: '/admin/customers', icon: Users },
        { label: 'Inquiries & Complaints', path: '/admin/inquiries', icon: MessageSquare },
        { label: 'Charter & Corporate', path: '/admin/requests', icon: FileQuestion },
      ],
    },
    {
      title: 'Management',
      items: [
        { label: 'Pricing & Fares', path: '/admin/pricing', icon: CircleDollarSign },
        { label: 'Fleet & Drivers', path: '/admin/fleet', icon: Truck },
        { label: 'Terminals', path: '/admin/terminals', icon: MapPin },
        { label: 'Revenue & Reports', path: '/admin/reports', icon: BarChart3 },
        { label: 'System Settings', path: '/admin/settings', icon: Settings },
      ],
    },
  ];

  return (
    <aside className="w-64 bg-card text-card-foreground flex-shrink-0 flex flex-col min-h-screen border-r border-border">
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-black text-sm shadow-xs">
            A
          </div>
          <div>
            <span className="font-bold text-foreground text-sm block leading-none">
              {BRAND.shortName} Staff
            </span>
            <span className="text-[10px] text-primary font-medium tracking-wider uppercase block mt-1">
              Operations &amp; Admin
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-6">
        {navSections.map((section) => (
          <div key={section.title}>
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground px-3 block mb-2">
              {section.title}
            </span>
            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = currentPath === item.path;
                return (
                  <button
                    key={item.path}
                    type="button"
                    onClick={() => onNavigate(item.path)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium rounded-xl transition-colors text-left min-h-[44px] cursor-pointer ${
                      isActive
                        ? 'bg-primary text-primary-foreground font-semibold shadow-xs'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <Icon className="w-4 h-4 flex-shrink-0 opacity-80" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="p-3 border-t border-border">
        <button
          type="button"
          onClick={() => onNavigate('/')}
          className="w-full flex items-center gap-2 px-3 py-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl min-h-[44px] transition-colors cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Exit to Public Site</span>
        </button>
      </div>
    </aside>
  );
}
