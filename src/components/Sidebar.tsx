import { Upload, Brain, BarChart3, TrendingUp, Moon, Sun } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { AppView } from '@/types/sales';
import { cn } from '@/lib/utils';

const navItems: { view: AppView; label: string; icon: React.ElementType }[] = [
  { view: 'upload', label: 'Upload Data', icon: Upload },
  { view: 'training', label: 'Model Training', icon: Brain },
  { view: 'dashboard', label: 'Dashboard', icon: BarChart3 },
  { view: 'forecast', label: 'Forecast', icon: TrendingUp },
];

export default function Sidebar() {
  const { currentView, setCurrentView, darkMode, toggleDarkMode, processedData, trainingResult } = useAppState();

  return (
    <aside className="fixed left-0 top-0 bottom-0 w-60 bg-sidebar border-r border-sidebar-border flex flex-col z-10">
      <div className="px-5 py-6">
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-foreground tracking-tight">SalesCast</h1>
            <p className="text-[11px] text-muted-foreground">Predictive Forecasting</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 space-y-0.5">
        {navItems.map(({ view, label, icon: Icon }) => {
          const isActive = currentView === view;
          const isDisabled = (view === 'training' && !processedData) ||
                           (view === 'dashboard' && !trainingResult) ||
                           (view === 'forecast' && !trainingResult);

          return (
            <button
              key={view}
              onClick={() => !isDisabled && setCurrentView(view)}
              disabled={isDisabled}
              className={cn(
                "w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm transition-colors",
                isActive
                  ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium"
                  : "text-sidebar-foreground hover:bg-sidebar-accent/50",
                isDisabled && "opacity-40 cursor-not-allowed"
              )}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {label}
            </button>
          );
        })}
      </nav>

      <div className="px-3 pb-4">
        <button
          onClick={toggleDarkMode}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        >
          {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          {darkMode ? 'Light Mode' : 'Dark Mode'}
        </button>
      </div>
    </aside>
  );
}
