import { AppProvider, useAppState } from '@/context/AppContext';
import Sidebar from '@/components/Sidebar';
import UploadView from '@/components/UploadView';
import TrainingView from '@/components/TrainingView';
import DashboardView from '@/components/DashboardView';
import ForecastView from '@/components/ForecastView';

function MainContent() {
  const { currentView } = useAppState();

  return (
    <div className="ml-60 min-h-screen">
      <div className="max-w-[1200px] mx-auto p-8">
        {currentView === 'upload' && <UploadView />}
        {currentView === 'training' && <TrainingView />}
        {currentView === 'dashboard' && <DashboardView />}
        {currentView === 'forecast' && <ForecastView />}
      </div>
    </div>
  );
}

export default function Index() {
  return (
    <AppProvider>
      <Sidebar />
      <MainContent />
    </AppProvider>
  );
}
