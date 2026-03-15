import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useAppState } from '@/context/AppContext';
import { generateForecast } from '@/lib/mlModels';
import { ForecastResult } from '@/types/sales';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Download, TrendingUp, TrendingDown, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';

const periods = [
  { value: 'week' as const, label: 'Next Week' },
  { value: 'month' as const, label: 'Next Month' },
  { value: 'quarter' as const, label: 'Next Quarter' },
];

const containerVars = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.3, ease: [0.25, 0.1, 0.25, 1], staggerChildren: 0.05 } },
};
const itemVars = { initial: { opacity: 0, y: 8 }, animate: { opacity: 1, y: 0 } };

export default function ForecastView() {
  const { processedData, selectedModel, trainingResult } = useAppState();
  const [activePeriod, setActivePeriod] = useState<'week' | 'month' | 'quarter'>('month');
  const [forecast, setForecast] = useState<ForecastResult | null>(null);

  const runForecast = useCallback((period: 'week' | 'month' | 'quarter') => {
    if (!processedData) return;
    setActivePeriod(period);
    const result = generateForecast(processedData.monthlyAggregated, period, selectedModel);
    setForecast(result);
  }, [processedData, selectedModel]);

  const exportCSV = useCallback(() => {
    if (!forecast) return;
    const header = 'Date,Predicted_Revenue,Lower_Bound,Upper_Bound\n';
    const rows = forecast.predictions.map(p => `${p.date},${p.predictedRevenue},${p.lowerBound},${p.upperBound}`).join('\n');
    const blob = new Blob([header + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `forecast_${activePeriod}.csv`; a.click();
    URL.revokeObjectURL(url);
  }, [forecast, activePeriod]);

  // Build chart data: historical + forecast
  const chartData = processedData ? [
    ...processedData.monthlyAggregated.slice(-8).map(m => ({
      date: m.month,
      actual: m.revenue,
      predicted: null as number | null,
      lower: null as number | null,
      upper: null as number | null,
    })),
    ...(forecast?.predictions.map(p => ({
      date: p.date,
      actual: null as number | null,
      predicted: p.predictedRevenue,
      lower: p.lowerBound,
      upper: p.upperBound,
    })) || []),
  ] : [];

  const isPositive = forecast ? forecast.growthRate >= 0 : true;

  return (
    <motion.div variants={containerVars} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={itemVars} className="flex items-start justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Sales Forecast</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {trainingResult ? `Using ${trainingResult.model === 'linear' ? 'Linear Regression' : trainingResult.model === 'randomForest' ? 'Random Forest' : 'XGBoost'} model` : ''}
          </p>
        </div>
        {forecast && (
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity">
            <Download className="h-4 w-4" /> Export CSV
          </button>
        )}
      </motion.div>

      {/* Period tabs */}
      <motion.div variants={itemVars} className="flex gap-2">
        {periods.map(p => (
          <button
            key={p.value}
            onClick={() => runForecast(p.value)}
            className={cn(
              "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all",
              activePeriod === p.value && forecast
                ? "bg-primary text-primary-foreground"
                : "bg-card card-shadow text-foreground hover:card-shadow-hover"
            )}
          >
            <Calendar className="h-3.5 w-3.5" />
            {p.label}
          </button>
        ))}
      </motion.div>

      {!forecast && (
        <motion.div variants={itemVars} className="card-shadow rounded-2xl p-12 bg-card text-center">
          <TrendingUp className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-sm text-muted-foreground">Select a forecast period above to generate predictions.</p>
        </motion.div>
      )}

      {forecast && (
        <motion.div variants={containerVars} initial="initial" animate="animate" className="space-y-4">
          {/* Summary cards */}
          <motion.div variants={itemVars} className="grid grid-cols-3 gap-4">
            <div className="card-shadow rounded-2xl p-4 bg-card">
              <p className="text-xs text-muted-foreground">Predicted Revenue</p>
              <p className="text-2xl font-medium font-data mt-1">${forecast.totalPredictedRevenue.toLocaleString()}</p>
            </div>
            <div className="card-shadow rounded-2xl p-4 bg-card">
              <p className="text-xs text-muted-foreground">Growth Rate</p>
              <div className="flex items-end gap-2 mt-1">
                <p className={cn("text-2xl font-medium font-data", isPositive ? "text-success" : "text-destructive")}>
                  {isPositive ? '+' : ''}{forecast.growthRate}%
                </p>
                {isPositive ? <TrendingUp className="h-4 w-4 text-success mb-1" /> : <TrendingDown className="h-4 w-4 text-destructive mb-1" />}
              </div>
            </div>
            <div className="card-shadow rounded-2xl p-4 bg-card">
              <p className="text-xs text-muted-foreground">Forecast Points</p>
              <p className="text-2xl font-medium font-data mt-1">{forecast.predictions.length}</p>
            </div>
          </motion.div>

          {/* Forecast chart */}
          <motion.div variants={itemVars} className="card-shadow rounded-2xl p-5 bg-card">
            <p className="text-sm font-medium mb-4">Forecast vs Actual</p>
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="forecastFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.1} />
                    <stop offset="100%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  contentStyle={{
                    background: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                    fontSize: '12px',
                  }}
                  formatter={(value: number, name: string) => [`$${value?.toLocaleString() || '-'}`, name === 'actual' ? 'Actual' : name === 'predicted' ? 'Predicted' : name]}
                />
                <Line type="monotone" dataKey="actual" stroke="hsl(243, 75%, 59%)" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                <Line type="monotone" dataKey="predicted" stroke="hsl(243, 75%, 59%)" strokeWidth={2} strokeDasharray="6 3" dot={{ r: 3 }} connectNulls={false} />
                <Area type="monotone" dataKey="upper" stroke="none" fill="url(#forecastFill)" connectNulls={false} />
              </AreaChart>
            </ResponsiveContainer>
            <div className="flex items-center gap-6 mt-3 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-primary" /> Actual
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-0.5 bg-primary" style={{ borderTop: '2px dashed hsl(243,75%,59%)', height: 0 }} /> Predicted
              </div>
            </div>
          </motion.div>

          {/* Predictions table */}
          <motion.div variants={itemVars} className="card-shadow rounded-2xl bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium">Prediction Details</p>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  {['Date', 'Predicted Revenue', 'Lower Bound', 'Upper Bound'].map(h => (
                    <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {forecast.predictions.map((p, i) => (
                  <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                    <td className="px-4 py-2.5 font-data text-xs">{p.date}</td>
                    <td className="px-4 py-2.5 font-data font-medium">${p.predictedRevenue.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-data text-muted-foreground">${p.lowerBound.toLocaleString()}</td>
                    <td className="px-4 py-2.5 font-data text-muted-foreground">${p.upperBound.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  );
}
