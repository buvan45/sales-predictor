import { useState } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap, TreePine, Cpu, Check } from 'lucide-react';
import { useAppState } from '@/context/AppContext';
import { trainModel } from '@/lib/mlModels';
import { ModelType, ModelConfig } from '@/types/sales';
import { cn } from '@/lib/utils';

const models: ModelConfig[] = [
  { type: 'linear', label: 'Linear Regression', description: 'Fast baseline model. Good for linear trends.' },
  { type: 'randomForest', label: 'Random Forest', description: 'Ensemble model capturing non-linear patterns.' },
  { type: 'xgboost', label: 'XGBoost', description: 'Gradient boosting for highest accuracy.' },
];

const modelIcons: Record<ModelType, React.ElementType> = {
  linear: Zap,
  randomForest: TreePine,
  xgboost: Cpu,
};

import { containerVars, itemVars } from '@/lib/animations';

export default function TrainingView() {
  const { processedData, selectedModel, setSelectedModel, setTrainingResult, trainingResult, isTraining, setIsTraining, setCurrentView } = useAppState();
  const [progress, setProgress] = useState(0);

  const handleTrain = async () => {
    if (!processedData) return;
    setIsTraining(true);
    setProgress(0);
    setTrainingResult(null);

    const interval = setInterval(() => {
      setProgress(p => Math.min(p + Math.random() * 15, 95));
    }, 200);

    const result = await trainModel(processedData.monthlyAggregated, selectedModel);
    clearInterval(interval);
    setProgress(100);

    setTimeout(() => {
      setTrainingResult(result);
      setIsTraining(false);
    }, 300);
  };

  return (
    <motion.div variants={containerVars} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={itemVars}>
        <h2 className="text-2xl font-semibold tracking-tight">Model Training</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Select a model and train on {processedData?.summary.totalRecords.toLocaleString()} records.
        </p>
      </motion.div>

      {/* Model selection */}
      <motion.div variants={itemVars} className="grid grid-cols-3 gap-3">
        {models.map((model) => {
          const Icon = modelIcons[model.type];
          const isSelected = selectedModel === model.type;
          return (
            <button
              key={model.type}
              onClick={() => !isTraining && setSelectedModel(model.type)}
              disabled={isTraining}
              className={cn(
                "card-shadow rounded-2xl p-4 text-left transition-all bg-card",
                isSelected ? "ring-2 ring-primary" : "hover:card-shadow-hover",
                isTraining && "opacity-60 cursor-not-allowed"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-2", isSelected ? "text-primary" : "text-muted-foreground")} />
              <p className="text-sm font-medium">{model.label}</p>
              <p className="text-xs text-muted-foreground mt-1">{model.description}</p>
            </button>
          );
        })}
      </motion.div>

      {/* Train button */}
      <motion.div variants={itemVars}>
        <div className="card-shadow rounded-2xl bg-card overflow-hidden">
          {isTraining && (
            <div className="h-0.5 bg-muted overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: '0%' }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          )}
          <div className="p-5">
            <button
              onClick={handleTrain}
              disabled={isTraining || !processedData}
              className={cn(
                "w-full py-3 rounded-xl text-sm font-medium transition-opacity",
                isTraining
                  ? "bg-muted text-muted-foreground cursor-not-allowed"
                  : "bg-primary text-primary-foreground hover:opacity-90"
              )}
            >
              {isTraining ? `Training ${models.find(m => m.type === selectedModel)?.label}... ${Math.round(progress)}%` : 'Start Training'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Results */}
      {trainingResult && (
        <motion.div variants={containerVars} initial="initial" animate="animate" className="space-y-4">
          <motion.div variants={itemVars} className="flex items-center gap-2">
            <Check className="h-5 w-5 text-success" />
            <p className="text-sm font-medium">Training complete in {(trainingResult.trainingTime / 1000).toFixed(1)}s</p>
          </motion.div>

          {/* Metric cards */}
          <motion.div variants={itemVars} className="grid grid-cols-3 gap-4">
            {[
              { label: 'MAE', value: trainingResult.mae.toFixed(2), desc: 'Mean Absolute Error' },
              { label: 'RMSE', value: trainingResult.rmse.toFixed(2), desc: 'Root Mean Square Error' },
              { label: 'R² Score', value: trainingResult.r2.toFixed(4), desc: 'Model Accuracy' },
            ].map((m) => (
              <div key={m.label} className="card-shadow rounded-2xl p-4 bg-card">
                <p className="text-xs text-muted-foreground">{m.label}</p>
                <p className="text-2xl font-medium font-data mt-1">{m.value}</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">{m.desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Feature importance */}
          <motion.div variants={itemVars} className="card-shadow rounded-2xl p-5 bg-card">
            <p className="text-sm font-medium mb-3">Feature Importance</p>
            <div className="space-y-2.5">
              {trainingResult.featureImportance.map((f) => (
                <div key={f.feature} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-28 shrink-0">{f.feature}</span>
                  <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      initial={{ width: 0 }}
                      animate={{ width: `${f.importance * 100 / trainingResult.featureImportance[0].importance}%` }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </div>
                  <span className="text-xs font-data text-muted-foreground w-12 text-right">{(f.importance * 100).toFixed(1)}%</span>
                </div>
              ))}
            </div>
          </motion.div>

          <button
            onClick={() => setCurrentView('dashboard')}
            className="w-full py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            View Dashboard →
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
