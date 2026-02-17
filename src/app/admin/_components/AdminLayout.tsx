import { ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface AdminLayoutProps {
  children: ReactNode;
}

const navItems = [
  { href: '/admin', label: 'Dashboard', icon: '📊' },
  { href: '/admin/users', label: 'Users', icon: '👥' },
  { href: '/admin/moderation', label: 'Moderation', icon: '🛡️' },
  { href: '/admin/activity', label: 'Activity Log', icon: '📋' },
  { href: '/admin/settings', label: 'Settings', icon: '⚙️' },
];

export function AdminLayout({ children }: AdminLayoutProps) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen bg-[var(--bg)]">
      {/* Sidebar */}
      <aside className="w-64 bg-[var(--card)] border-r border-[var(--border)] hidden lg:block">
        <div className="p-6">
          <h1 className="text-xl font-bold text-[var(--accent)]">Admin Panel</h1>
          <p className="text-sm text-[var(--muted)] mt-1">Tutor Startup</p>
        </div>
        
        <nav className="px-4 pb-6">
          {navItems.map((item) => {
            const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                  isActive
                    ? 'bg-[var(--accent)] text-white'
                    : 'text-[var(--text)] hover:bg-[var(--muted)]'
                }`}
              >
                <span>{item.icon}</span>
                <span className="font-medium">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        {/* Mobile header */}
        <div className="lg:hidden bg-[var(--card)] border-b border-[var(--border)] p-4">
          <h1 className="text-lg font-bold">Admin Panel</h1>
        </div>
        
        <div className="p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
