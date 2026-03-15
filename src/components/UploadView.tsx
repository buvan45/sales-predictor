import { useCallback, useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Upload, FileText, Download, CheckCircle2, AlertCircle } from 'lucide-react';
import Papa from 'papaparse';
import { useAppState } from '@/context/AppContext';
import { parseCSVData, processData } from '@/lib/dataProcessing';
import { generateSampleData } from '@/lib/mlModels';
import { cn } from '@/lib/utils';

import { containerVars, itemVars } from '@/lib/animations';

export default function UploadView() {
  const { setRawData, setProcessedData, processedData, setCurrentView } = useAppState();
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    setError(null);
    if (!file.name.endsWith('.csv')) {
      setError('Please upload a CSV file.');
      return;
    }
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        try {
          const raw = results.data as Record<string, string>[];
          setRawData(raw);
          const records = parseCSVData(raw);
          if (records.length === 0) {
            setError('No valid records found. Check column names: Date, Revenue, etc.');
            return;
          }
          const processed = processData(records);
          setProcessedData(processed);
        } catch {
          setError('Failed to parse CSV. Ensure proper formatting.');
        }
      },
      error: () => setError('Failed to read file.'),
    });
  }, [setRawData, setProcessedData]);

  const loadSample = useCallback(() => {
    const csv = generateSampleData();
    const blob = new Blob([csv], { type: 'text/csv' });
    handleFile(new File([blob], 'sample_sales.csv'));
  }, [handleFile]);

  const downloadSample = useCallback(() => {
    const csv = generateSampleData();
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'sample_sales_data.csv'; a.click();
    URL.revokeObjectURL(url);
  }, []);

  return (
    <motion.div variants={containerVars} initial="initial" animate="animate" className="max-w-3xl mx-auto space-y-6">
      <motion.div variants={itemVars}>
        <h2 className="text-2xl font-semibold tracking-tight">Upload Dataset</h2>
        <p className="text-sm text-muted-foreground mt-1">Upload your sales data in CSV format to begin forecasting.</p>
      </motion.div>

      {/* Drop zone */}
      <motion.div variants={itemVars}>
        <div
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => { e.preventDefault(); setIsDragging(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          onClick={() => fileRef.current?.click()}
          className={cn(
            "relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-200",
            isDragging
              ? "border-primary bg-primary/5 scale-[1.02]"
              : "border-border hover:border-muted-foreground/30",
            processedData && "border-success/30 bg-success/5"
          )}
        >
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          
          {processedData ? (
            <div className="space-y-2">
              <CheckCircle2 className="h-10 w-10 mx-auto text-success" />
              <p className="text-sm font-medium">Dataset loaded successfully</p>
              <p className="text-xs text-muted-foreground">{processedData.summary.totalRecords.toLocaleString()} records • Click to replace</p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Drop your CSV file here</p>
                <p className="text-xs text-muted-foreground mt-1">or click to browse</p>
              </div>
            </div>
          )}
        </div>
        {error && (
          <div className="flex items-center gap-2 mt-3 text-sm text-destructive">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}
      </motion.div>

      {/* Sample data actions */}
      <motion.div variants={itemVars} className="flex gap-3">
        <button onClick={loadSample} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity">
          <FileText className="h-4 w-4" /> Load Sample Data
        </button>
        <button onClick={downloadSample} className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-secondary text-secondary-foreground hover:opacity-90 transition-opacity">
          <Download className="h-4 w-4" /> Download Sample CSV
        </button>
      </motion.div>

      {/* Data preview */}
      {processedData && (
        <motion.div variants={itemVars} className="space-y-4">
          {/* Summary cards */}
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: 'Total Records', value: processedData.summary.totalRecords.toLocaleString() },
              { label: 'Total Revenue', value: `$${processedData.summary.totalRevenue.toLocaleString()}` },
              { label: 'Avg Revenue', value: `$${processedData.summary.avgRevenue.toLocaleString()}` },
            ].map((card) => (
              <div key={card.label} className="card-shadow rounded-2xl p-4 bg-card">
                <p className="text-xs text-muted-foreground">{card.label}</p>
                <p className="text-xl font-medium font-data mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          {/* Preview table */}
          <div className="card-shadow rounded-2xl bg-card overflow-hidden">
            <div className="px-4 py-3 border-b border-border">
              <p className="text-sm font-medium">Data Preview (first 5 rows)</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    {['Date', 'Product', 'Qty', 'Revenue', 'Region', 'Price'].map(h => (
                      <th key={h} className="text-left px-4 py-2.5 text-xs font-medium text-muted-foreground">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {processedData.records.slice(0, 5).map((r, i) => (
                    <tr key={i} className="border-b border-border last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="px-4 py-2.5 font-data text-xs">{r.date}</td>
                      <td className="px-4 py-2.5">{r.productName}</td>
                      <td className="px-4 py-2.5 font-data">{r.salesQuantity}</td>
                      <td className="px-4 py-2.5 font-data">${r.revenue.toLocaleString()}</td>
                      <td className="px-4 py-2.5">{r.region}</td>
                      <td className="px-4 py-2.5 font-data">${r.price}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <button
            onClick={() => setCurrentView('training')}
            className="w-full py-3 rounded-xl text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
          >
            Continue to Model Training →
          </button>
        </motion.div>
      )}

      {/* Expected format */}
      <motion.div variants={itemVars} className="card-shadow rounded-2xl p-5 bg-card">
        <p className="text-sm font-medium mb-2">Expected CSV Format</p>
        <code className="text-xs font-mono text-muted-foreground leading-relaxed block">
          Date, Product_ID, Product_Name, Sales_Quantity, Revenue, Region, Price
        </code>
      </motion.div>
    </motion.div>
  );
}
