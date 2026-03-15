// Types for the sales forecasting application

export interface SalesRecord {
  date: string;
  productId: string;
  productName: string;
  salesQuantity: number;
  revenue: number;
  region: string;
  price: number;
}

export interface ProcessedData {
  records: SalesRecord[];
  summary: DataSummary;
  monthlyAggregated: MonthlyData[];
  regionalData: RegionalData[];
}

export interface DataSummary {
  totalRecords: number;
  totalRevenue: number;
  avgRevenue: number;
  dateRange: { start: string; end: string };
  uniqueProducts: number;
  uniqueRegions: number;
  missingValuesHandled: number;
}

export interface MonthlyData {
  month: string;
  revenue: number;
  quantity: number;
  avgPrice: number;
}

export interface RegionalData {
  region: string;
  revenue: number;
  quantity: number;
  percentage: number;
}

export type ModelType = 'linear' | 'randomForest' | 'xgboost';

export interface ModelConfig {
  type: ModelType;
  label: string;
  description: string;
}

export interface TrainingResult {
  model: ModelType;
  mae: number;
  rmse: number;
  r2: number;
  featureImportance: FeatureImportance[];
  trainingTime: number;
}

export interface FeatureImportance {
  feature: string;
  importance: number;
}

export interface ForecastResult {
  period: 'week' | 'month' | 'quarter';
  predictions: ForecastPoint[];
  totalPredictedRevenue: number;
  growthRate: number;
}

export interface ForecastPoint {
  date: string;
  predictedRevenue: number;
  lowerBound: number;
  upperBound: number;
}

export type AppView = 'upload' | 'training' | 'dashboard' | 'forecast';
