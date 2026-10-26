import React, { useState } from 'react';
import { Link, useLocation, useNavigate, Outlet } from 'react-router-dom';
import {
  Users, Building2, GitFork, ClipboardCheck, Laptop, 
  FileText, ShieldAlert, LayoutDashboard, Clock, Calendar, 
  DollarSign, UserCheck, Award, CreditCard, BarChart3, 
  Bot, BrainCircuit, Bell, Search, Sun, Moon, LogOut, 
  ChevronRight, ChevronDown, Menu, X, User as UserIcon,
  CheckCircle2, AlertCircle, Info, Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';

export const AppLayout: React.FC = () => {
  const { user, personas, logout, switchPersona } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [personaMenuOpen, setPersonaMenuOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const navigation = [
    {
      group: 'Overview',
      items: [
        { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, roles: ['*'] },
      ]
    },
    {
      group: 'Core HR',
      items: [
        { name: 'Employee Directory', href: '/employees', icon: Users, roles: ['*'] },
        { name: 'Organization Chart', href: '/organization', icon: GitFork, roles: ['*'] },
        { name: 'Departments & Teams', href: '/departments', icon: Building2, roles: ['*'] },
      ]
    },
    {
      group: 'Workforce Lifecycle',
      items: [
        { name: 'Onboarding & Exits', href: '/onboarding', icon: ClipboardCheck, roles: ['*'] },
        { name: 'Asset Management', href: '/assets', icon: Laptop, roles: ['*'] },
        { name: 'Document Vault', href: '/documents', icon: FileText, roles: ['*'] },
      ]
    },
    {
      group: 'Governance & Security',
      items: [
        { 
          name: 'Audit Trail', 
          href: '/audit', 
          icon: ShieldAlert, 
          roles: ['Super Admin', 'HR Manager', 'IT Administrator'] 
        },
      ]
    },
    {
      group: 'HR Operations',
      items: [
        { name: 'Attendance & Time', href: '/attendance', icon: Clock, roles: ['*'] },
        { name: 'Leave & Absences', href: '/leave', icon: Calendar, roles: ['*'] },
        { name: 'Payroll & Compensation', href: '/payroll', icon: DollarSign, roles: ['*'] },
        { name: 'Recruitment & ATS', href: '/recruitment', icon: UserCheck, roles: ['*'] },
        { name: 'Performance & OKRs', href: '/performance', icon: Award, roles: ['*'] },
        { name: 'Expenses & Self-Service', href: '/expenses', icon: CreditCard, roles: ['*'] },
        { name: 'Workforce BI Reports', href: '/reports', icon: BarChart3, roles: ['*'] },
      ]
    },
    {
      group: 'AI & Analytics (Phase 3 Active)',
      items: [
        {
          name: 'Attrition ML & Governance',
          href: '/analytics/attrition-ai',
          icon: BrainCircuit,
          roles: ['Super Admin', 'HR Manager', 'Department Manager']
        },
        {
          name: 'AI HR Assistant (RAG)',
          href: '/hr-assistant',
          icon: Bot,
          roles: ['*']
        },
      ]
    }
  ];

  const handleGlobalSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/employees?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
    }
  };

  const isAuthorized = (allowedRoles: string[]) => {
    if (allowedRoles.includes('*')) return true;
    if (!user) return false;
    return allowedRoles.includes(user.role);
  };

  // Generate Breadcrumbs
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const breadcrumbNameMap: Record<string, string> = {
    dashboard: 'Dashboard',
    employees: 'Employee Directory',
    organization: 'Organization Chart',
    departments: 'Departments & Teams',
    onboarding: 'Onboarding & Exits',
    assets: 'Asset Management',
    documents: 'Document Vault',
    audit: 'Audit Trail',
    planned: 'Roadmap',
    attendance: 'Attendance',
    leave: 'Leave',
    payroll: 'Payroll',
    recruitment: 'Recruitment',
    performance: 'Performance',
    expenses: 'Expenses',
    reports: 'Reports',
    analytics: 'AI & Analytics',
    'attrition-ai': 'Attrition Risk & Governance',
    'hr-assistant': 'AI HR Assistant (RAG)',
    'ai-insights': 'AI Insights',
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans">
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 h-16 flex items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title="Toggle Sidebar"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* Enterprise Logo */}
          <Link to="/dashboard" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-brand-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-brand-500/20">
              <Building2 className="w-5 h-5" />
            </div>
            <div className="hidden sm:block">
              <span className="font-bold text-lg text-slate-900 dark:text-white tracking-tight">Enterprise</span>
              <span className="font-semibold text-lg text-brand-600 dark:text-brand-400">HRMS</span>
            </div>
          </Link>

          <span className="hidden md:inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
            Phase 2 Operations
          </span>
        </div>

        {/* Search Bar */}
        <div className="flex-1 max-w-md mx-4 hidden md:block">
          <form onSubmit={handleGlobalSearch} className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search directory by name, ID, or email... (Press Enter)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-100 dark:bg-slate-800/80 border border-transparent focus:border-brand-500 dark:focus:border-brand-400 rounded-lg text-slate-900 dark:text-slate-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500/20 transition"
            />
          </form>
        </div>

        {/* Right Tools & Role Switcher */}
        <div className="flex items-center gap-2">
          {/* Quick Role / Persona Switcher (For seamless testing across 7 enterprise roles) */}
          <div className="relative">
            <button
              onClick={() => setPersonaMenuOpen(!personaMenuOpen)}
              className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-xs font-medium text-slate-700 dark:text-slate-200 transition"
              title="Switch enterprise portal persona"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="font-semibold text-slate-900 dark:text-white hidden lg:inline">Role:</span>
              <span className="max-w-[120px] truncate">{user?.role || 'Guest'}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {personaMenuOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-100 dark:border-slate-800">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Switch Role Portal (Demo Evaluation)
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    Select any of the 7 enterprise personas to test role-specific dashboard & access controls:
                  </div>
                </div>
                <div className="max-h-72 overflow-y-auto py-1">
                  {personas.map((p) => {
                    const isActive = user?.id === p.id;
                    return (
                      <button
                        key={p.id}
                        onClick={() => {
                          switchPersona(p.id);
                          setPersonaMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800 transition ${
                          isActive ? 'bg-brand-50/70 dark:bg-brand-950/40 text-brand-700 dark:text-brand-300 font-semibold' : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-900 dark:text-white">{p.full_name}</div>
                          <div className="text-[11px] text-slate-500 dark:text-slate-400">
                            {p.role} · {p.department}
                          </div>
                        </div>
                        {isActive && <CheckCircle2 className="w-4 h-4 text-brand-600 dark:text-brand-400" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-600" />}
          </button>

          {/* Notifications Dropdown */}
          <div className="relative">
            <button
              onClick={() => setNotificationOpen(!notificationOpen)}
              className="p-2 text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 relative transition"
              title="Notifications & Announcements"
            >
              <Bell className="w-4 h-4" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-brand-500 rounded-full ring-2 ring-white dark:ring-slate-900"></span>
            </button>

            {notificationOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-900 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                  <span className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    Company Announcements
                  </span>
                  <span className="text-[10px] bg-brand-100 text-brand-700 dark:bg-brand-950 dark:text-brand-300 font-bold px-1.5 py-0.5 rounded">
                    Active
                  </span>
                </div>
                <div className="space-y-2 mt-2">
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Annual Benefits Enrollment 2026</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Please review the updated healthcare guidelines in the Document Vault.</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-50 dark:bg-slate-800/60 text-xs">
                    <div className="font-semibold text-slate-900 dark:text-slate-100">Q4 Town Hall Live Broadcast</div>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">Live executive presentation starting Thursday at 10 AM PST.</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* User Profile & Sign Out */}
          <div className="flex items-center pl-2 border-l border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center font-bold text-xs text-slate-700 dark:text-slate-300 border border-slate-300 dark:border-slate-600">
                {user?.full_name ? user.full_name.charAt(0) : 'U'}
              </div>
              <div className="hidden xl:block text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white leading-tight">{user?.full_name}</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-tight">{user?.email}</div>
              </div>
              <button
                onClick={() => {
                  logout();
                  navigate('/');
                }}
                className="p-1.5 text-slate-400 hover:text-red-600 dark:hover:text-red-400 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <aside
          className={`${
            sidebarOpen ? 'w-64' : 'w-20'
          } shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col justify-between hidden md:flex`}
        >
          <div className="p-3 overflow-y-auto space-y-6">
            {navigation.map((section, idx) => (
              <div key={idx}>
                {sidebarOpen && (
                  <div className="px-3 mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                    {section.group}
                  </div>
                )}
                <div className="space-y-1">
                  {section.items.map((item) => {
                    if ('roles' in item && item.roles && !isAuthorized(item.roles as string[])) {
                      return null;
                    }
                    const Icon = item.icon;
                    const isActive = location.pathname === item.href || location.pathname.startsWith(`${item.href}/`);
                    const isPlanned = 'phase' in item;

                    return (
                      <Link
                        key={item.name}
                        to={item.href}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-xs font-medium transition group ${
                          isActive
                            ? 'bg-brand-500 text-white shadow-sm shadow-brand-500/30'
                            : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/80 hover:text-slate-900 dark:hover:text-white'
                        }`}
                        title={!sidebarOpen ? item.name : undefined}
                      >
                        <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white' : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'}`} />
                        {sidebarOpen && (
                          <div className="flex-1 flex items-center justify-between truncate">
                            <span className="truncate">{item.name}</span>
                            {isPlanned && (
                              <span className="text-[9px] font-semibold uppercase px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                                {String((item as any).phase)}
                              </span>
                            )}
                          </div>
                        )}
                      </Link>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          {/* Sidebar Footer User Info */}
          {sidebarOpen && user && (
            <div className="p-3 border-t border-slate-200 dark:border-slate-800 m-2 rounded-xl bg-slate-50 dark:bg-slate-800/50">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-brand-100 dark:bg-brand-950 flex items-center justify-center text-brand-600 dark:text-brand-300 font-bold text-xs">
                  {user.full_name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-bold text-slate-900 dark:text-white truncate">{user.full_name}</div>
                  <div className="text-[10px] text-brand-600 dark:text-brand-400 font-medium truncate">{user.role}</div>
                </div>
              </div>
            </div>
          )}
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50/50 dark:bg-slate-950/50">
          {/* Breadcrumb Navigation */}
          <nav className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mb-6" aria-label="Breadcrumb">
            <Link to="/dashboard" className="hover:text-brand-600 dark:hover:text-brand-400 transition">
              Home
            </Link>
            {pathSegments.map((segment, index) => {
              const url = `/${pathSegments.slice(0, index + 1).join('/')}`;
              const isLast = index === pathSegments.length - 1;
              const title = breadcrumbNameMap[segment] || segment.charAt(0).toUpperCase() + segment.slice(1);

              return (
                <React.Fragment key={url}>
                  <ChevronRight className="w-3 h-3 text-slate-400" />
                  {isLast ? (
                    <span className="font-semibold text-slate-900 dark:text-slate-100">{title}</span>
                  ) : (
                    <Link to={url} className="hover:text-brand-600 dark:hover:text-brand-400 transition">
                      {title}
                    </Link>
                  )}
                </React.Fragment>
              );
            })}
          </nav>

          <Outlet />
        </main>
      </div>
    </div>
  );
};
