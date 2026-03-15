import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { ProcessedData, TrainingResult, ForecastResult, ModelType, AppView } from '@/types/sales';

interface AppState {
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  rawData: Record<string, string>[] | null;
  setRawData: (data: Record<string, string>[] | null) => void;
  processedData: ProcessedData | null;
  setProcessedData: (data: ProcessedData | null) => void;
  selectedModel: ModelType;
  setSelectedModel: (model: ModelType) => void;
  trainingResult: TrainingResult | null;
  setTrainingResult: (result: TrainingResult | null) => void;
  isTraining: boolean;
  setIsTraining: (v: boolean) => void;
  forecastResults: ForecastResult[];
  setForecastResults: (results: ForecastResult[]) => void;
  darkMode: boolean;
  toggleDarkMode: () => void;
}

const AppContext = createContext<AppState | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [currentView, setCurrentView] = useState<AppView>('upload');
  const [rawData, setRawData] = useState<Record<string, string>[] | null>(null);
  const [processedData, setProcessedData] = useState<ProcessedData | null>(null);
  const [selectedModel, setSelectedModel] = useState<ModelType>('linear');
  const [trainingResult, setTrainingResult] = useState<TrainingResult | null>(null);
  const [isTraining, setIsTraining] = useState(false);
  const [forecastResults, setForecastResults] = useState<ForecastResult[]>([]);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = useCallback(() => {
    setDarkMode(prev => {
      const next = !prev;
      document.documentElement.classList.toggle('dark', next);
      return next;
    });
  }, []);

  return (
    <AppContext.Provider value={{
      currentView, setCurrentView,
      rawData, setRawData,
      processedData, setProcessedData,
      selectedModel, setSelectedModel,
      trainingResult, setTrainingResult,
      isTraining, setIsTraining,
      forecastResults, setForecastResults,
      darkMode, toggleDarkMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useAppState() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppState must be used within AppProvider');
  return ctx;
}
