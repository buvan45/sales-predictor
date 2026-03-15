import { motion } from 'framer-motion';
import { useAppState } from '@/context/AppContext';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { TrendingUp, TrendingDown } from 'lucide-react';

import { containerVars, itemVars } from '@/lib/animations';

export default function DashboardView() {
  const { processedData, trainingResult } = useAppState();

  if (!processedData || !trainingResult) return null;

  const { monthlyAggregated, regionalData, summary } = processedData;
  
  const recentMonths = monthlyAggregated.slice(-6);
  const prevRevenue = recentMonths.length > 1 ? recentMonths[recentMonths.length - 2].revenue : 0;
  const lastRevenue = recentMonths[recentMonths.length - 1]?.revenue || 0;
  const monthlyGrowth = prevRevenue ? ((lastRevenue - prevRevenue) / prevRevenue * 100).toFixed(1) : '0';
  const isPositive = Number(monthlyGrowth) >= 0;

  return (
    <motion.div variants={containerVars} initial="initial" animate="animate" className="space-y-6">
      <motion.div variants={itemVars}>
        <h2 className="text-2xl font-semibold tracking-tight">Forecast Overview</h2>
        <p className="text-sm text-muted-foreground mt-1">
          Based on {summary.totalRecords.toLocaleString()} historical records. Model confidence: {(trainingResult.r2 * 100).toFixed(1)}%.
        </p>
      </motion.div>

      {/* Metric cards */}
      <motion.div variants={itemVars} className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Revenue', value: `$${summary.totalRevenue.toLocaleString()}`, trend: null },
          { label: 'Monthly Avg', value: `$${Math.round(summary.totalRevenue / monthlyAggregated.length).toLocaleString()}`, trend: null },
          { label: 'Last Month', value: `$${lastRevenue.toLocaleString()}`, trend: `${isPositive ? '+' : ''}${monthlyGrowth}%` },
          { label: 'R² Score', value: trainingResult.r2.toFixed(4), trend: null },
        ].map((card) => (
          <div key={card.label} className="card-shadow rounded-2xl p-4 bg-card">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <div className="flex items-end gap-2 mt-1">
              <p className="text-2xl font-medium font-data">{card.value}</p>
              {card.trend && (
                <span className={`flex items-center gap-0.5 text-xs font-medium pb-0.5 ${isPositive ? 'text-success' : 'text-destructive'}`}>
                  {isPositive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {card.trend}
                </span>
              )}
            </div>
          </div>
        ))}
      </motion.div>

      {/* Charts row */}
      <div className="grid grid-cols-8 gap-4">
        {/* Revenue trend - 5 cols */}
        <motion.div variants={itemVars} className="col-span-5 card-shadow rounded-2xl p-5 bg-card">
          <p className="text-sm font-medium mb-4">Revenue Trend</p>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={monthlyAggregated}>
              <defs>
                <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="hsl(243, 75%, 59%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `$${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{
                  background: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                  boxShadow: 'var(--shadow-card)',
                }}
                formatter={(value: number) => [`$${value.toLocaleString()}`, 'Revenue']}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(243, 75%, 59%)" strokeWidth={2} fill="url(#revGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Regional distribution - 3 cols */}
        <motion.div variants={itemVars} className="col-span-3 card-shadow rounded-2xl p-5 bg-card">
          <p className="text-sm font-medium mb-4">Regional Distribution</p>
          <div className="space-y-3">
            {regionalData.map((r) => (
              <div key={r.region}>
                <div className="flex justify-between text-xs mb-1">
                  <span>{r.region}</span>
                  <span className="font-data text-muted-foreground">{r.percentage}%</span>
                </div>
                <div className="h-2 rounded-full bg-muted overflow-hidden">
                  <motion.div
                    className="h-full rounded-full bg-primary"
                    initial={{ width: 0 }}
                    animate={{ width: `${r.percentage}%` }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Monthly bar chart */}
      <motion.div variants={itemVars} className="card-shadow rounded-2xl p-5 bg-card">
        <p className="text-sm font-medium mb-4">Monthly Sales Quantity</p>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyAggregated}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <YAxis tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
            <Tooltip
              contentStyle={{
                background: 'hsl(var(--card))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '8px',
                fontSize: '12px',
              }}
            />
            <Bar dataKey="quantity" fill="hsl(243, 75%, 59%)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>
    </motion.div>
  );
}
