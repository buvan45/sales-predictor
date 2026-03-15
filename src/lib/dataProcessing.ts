import { SalesRecord, ProcessedData, MonthlyData, RegionalData, DataSummary } from '@/types/sales';

export function parseCSVData(rawData: Record<string, string>[]): SalesRecord[] {
  let missingCount = 0;
  
  const records: SalesRecord[] = rawData
    .map((row) => {
      const date = row['Date'] || row['date'] || '';
      const productId = row['Product_ID'] || row['product_id'] || row['ProductID'] || 'UNKNOWN';
      const productName = row['Product_Name'] || row['product_name'] || row['ProductName'] || 'Unknown';
      const salesQuantity = parseFloat(row['Sales_Quantity'] || row['sales_quantity'] || row['Quantity'] || '0');
      const revenue = parseFloat(row['Revenue'] || row['revenue'] || '0');
      const region = row['Region'] || row['region'] || 'Unknown';
      const price = parseFloat(row['Price'] || row['price'] || '0');

      if (!date || isNaN(revenue)) {
        missingCount++;
        return null;
      }

      return {
        date,
        productId,
        productName,
        salesQuantity: isNaN(salesQuantity) ? 0 : salesQuantity,
        revenue: isNaN(revenue) ? 0 : revenue,
        region,
        price: isNaN(price) ? (revenue / (salesQuantity || 1)) : price,
      };
    })
    .filter(Boolean) as SalesRecord[];

  return records;
}

export function processData(records: SalesRecord[]): ProcessedData {
  const sorted = [...records].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  
  // Monthly aggregation
  const monthMap = new Map<string, { revenue: number; quantity: number; prices: number[] }>();
  sorted.forEach((r) => {
    const d = new Date(r.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const existing = monthMap.get(key) || { revenue: 0, quantity: 0, prices: [] };
    existing.revenue += r.revenue;
    existing.quantity += r.salesQuantity;
    existing.prices.push(r.price);
    monthMap.set(key, existing);
  });

  const monthlyAggregated: MonthlyData[] = Array.from(monthMap.entries()).map(([month, data]) => ({
    month,
    revenue: Math.round(data.revenue * 100) / 100,
    quantity: data.quantity,
    avgPrice: Math.round((data.prices.reduce((a, b) => a + b, 0) / data.prices.length) * 100) / 100,
  }));

  // Regional aggregation
  const regionMap = new Map<string, { revenue: number; quantity: number }>();
  sorted.forEach((r) => {
    const existing = regionMap.get(r.region) || { revenue: 0, quantity: 0 };
    existing.revenue += r.revenue;
    existing.quantity += r.salesQuantity;
    regionMap.set(r.region, existing);
  });

  const totalRev = sorted.reduce((sum, r) => sum + r.revenue, 0);
  const regionalData: RegionalData[] = Array.from(regionMap.entries())
    .map(([region, data]) => ({
      region,
      revenue: Math.round(data.revenue * 100) / 100,
      quantity: data.quantity,
      percentage: Math.round((data.revenue / totalRev) * 10000) / 100,
    }))
    .sort((a, b) => b.revenue - a.revenue);

  const uniqueProducts = new Set(sorted.map((r) => r.productId)).size;
  const uniqueRegions = new Set(sorted.map((r) => r.region)).size;

  const summary: DataSummary = {
    totalRecords: sorted.length,
    totalRevenue: Math.round(totalRev * 100) / 100,
    avgRevenue: Math.round((totalRev / sorted.length) * 100) / 100,
    dateRange: {
      start: sorted[0]?.date || '',
      end: sorted[sorted.length - 1]?.date || '',
    },
    uniqueProducts,
    uniqueRegions,
    missingValuesHandled: 0,
  };

  return { records: sorted, summary, monthlyAggregated, regionalData };
}
