import { BookOpen, CalendarDays, CirclePlus, House, UserRound } from 'lucide-react';
import { NavLink, Outlet } from 'react-router-dom';
import { Brand } from './Brand';
import { useNutrition } from '../state/NutritionContext';
import { LoadingState } from './LoadingState';

const navItems = [
  { to: '/', label: 'Hoy', icon: House, end: true },
  { to: '/plan', label: 'Mi plan', icon: CalendarDays },
  { to: '/agregar', label: 'Agregar', icon: CirclePlus, emphasized: true },
  { to: '/recetas', label: 'Recetas', icon: BookOpen },
  { to: '/perfil', label: 'Perfil', icon: UserRound },
];

export function AppShell() {
  const { loading, error, repositoryMode, toast, dismissToast } = useNutrition();
  return <div className="app-shell">
    <div className="ambient ambient-one" aria-hidden="true" /><div className="ambient ambient-two" aria-hidden="true" />
    <header className="topbar">
      <Brand />
      <nav className="desktop-nav" aria-label="Navegación principal">
        {navItems.map(({ to, label, icon: Icon, end }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'active' : ''}><Icon size={18} />{label}</NavLink>)}
      </nav>
      <span className="demo-badge">{repositoryMode === 'demo' ? 'Modo demo' : 'Supabase'}</span>
    </header>
    {error && <div className="error-banner" role="alert">{error}</div>}
    {loading ? <LoadingState /> : <Outlet />}
    <nav className="bottom-nav" aria-label="Navegación principal">
      {navItems.map(({ to, label, icon: Icon, end, emphasized }) => <NavLink key={to} to={to} end={end} className={({ isActive }) => `${isActive ? 'active ' : ''}${emphasized ? 'nav-add' : ''}`}><span><Icon size={emphasized ? 25 : 21} /></span><small>{label}</small></NavLink>)}
    </nav>
    {toast && <div className="toast" role="status" aria-live="polite"><span>{toast}</span><button onClick={dismissToast} aria-label="Cerrar mensaje">×</button></div>}
  </div>;
}
