import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { LayoutDashboard, Users, BookOpen, UserPlus, Building2, X } from 'lucide-react';
import { cn } from '@/utils/cn';
import { useAuthStore } from '@/store/authStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  to: string;
  icon: React.ReactNode;
  label: string;
  adminOnly?: boolean;
}

const navItems: NavItem[] = [
  { to: '/dashboard', icon: <LayoutDashboard size={18} />, label: 'Dashboard' },
  { to: '/customers', icon: <Users size={18} />, label: 'Customers' },
  { to: '/users', icon: <UserPlus size={18} />, label: 'Users', adminOnly: true },
];

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'Admin';

  const items = navItems.filter(item => !item.adminOnly || isAdmin);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      <div className="h-16 flex items-center px-6 border-b border-white/10 gap-3">
        <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center">
          <Building2 size={18} className="text-white" />
        </div>
        <div>
          <p className="text-white font-semibold text-sm leading-none">F&D Warehouse</p>
          <p className="text-white/50 text-xs mt-0.5">Credit Ledger</p>
        </div>
        <button
          onClick={onClose}
          className="ml-auto lg:hidden p-1.5 rounded-lg hover:bg-white/10 text-white/60 transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {items.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            onClick={() => { if (window.innerWidth < 1024) onClose(); }}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
                isActive
                  ? 'bg-white/15 text-white'
                  : 'text-white/60 hover:bg-white/10 hover:text-white/90'
              )
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center flex-shrink-0">
            <span className="text-white text-xs font-semibold">
              {user?.firstName?.[0]}{user?.lastName?.[0]}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.fullName}</p>
            <p className="text-white/50 text-xs truncate">{user?.email}</p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 bg-primary-900 fixed inset-y-0 left-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile overlay sidebar */}
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-20 lg:hidden"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -264 }}
              animate={{ x: 0 }}
              exit={{ x: -264 }}
              transition={{ type: 'tween', duration: 0.2 }}
              className="fixed inset-y-0 left-0 w-64 bg-primary-900 z-40 lg:hidden flex flex-col"
            >
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
