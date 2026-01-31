'use client';

import { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateSettings } from '@/app/actions';
import { Download, Upload, AlertTriangle, Key, Eye, EyeOff, Copy, Check, Trash2 } from 'lucide-react';
import { exportDatabase, importDatabase } from '@/app/actions';

const COMMON_CURRENCIES = [
  { code: '$', name: 'US Dollar' },
  { code: '€', name: 'Euro' },
  { code: '£', name: 'British Pound' },
  { code: '¥', name: 'Japanese Yen' },
  { code: 'RSD', name: 'Serbian Dinar' },
];

type SettingsDialogProps = {
  children: React.ReactNode;
  currentCurrency: string;
  apiEnabled: boolean;
  apiSecret: string | null;
  simulationPriceMode: 'min' | 'max' | 'average';
};

export function SettingsDialog({ children, currentCurrency, apiEnabled: initialApiEnabled, apiSecret, simulationPriceMode: initialSimulationPriceMode }: SettingsDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [currency, setCurrency] = useState(currentCurrency);
  const [customCurrency, setCustomCurrency] = useState('');
  const [apiEnabled, setApiEnabled] = useState(initialApiEnabled);
  const [simulationPriceMode, setSimulationPriceMode] = useState<'min' | 'max' | 'average'>(initialSimulationPriceMode);
  const [showApiSecret, setShowApiSecret] = useState(false);
  const [copied, setCopied] = useState(false);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [cleanupStatus, setCleanupStatus] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      setCurrency(currentCurrency);
      setCustomCurrency('');
      setApiEnabled(initialApiEnabled);
      setSimulationPriceMode(initialSimulationPriceMode);
      setImportStatus(null);
      setCleanupStatus(null);
      setShowApiSecret(false);
      setCopied(false);
    }
  }, [open, currentCurrency, initialApiEnabled, initialSimulationPriceMode]);

  async function handleCleanup() {
    setCleaningUp(true);
    setCleanupStatus(null);
    try {
      const response = await fetch('/api/cleanup-icons', {
        method: 'POST',
      });
      
      const result = await response.json();
      
      if (result.success) {
        setCleanupStatus({ 
          type: 'success', 
          message: result.deletedCount > 0 
            ? `Cleaned up ${result.deletedCount} unused icon(s)` 
            : 'No unused icons found'
        });
      } else {
        setCleanupStatus({ type: 'error', message: result.error || 'Cleanup failed' });
      }
    } catch (error) {
      console.error('Cleanup failed:', error);
      setCleanupStatus({ type: 'error', message: 'Failed to cleanup icons' });
    } finally {
      setCleaningUp(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const finalCurrency = customCurrency || currency;
    const formData = new FormData();
    formData.append('currency', finalCurrency);
    formData.append('apiEnabled', apiEnabled.toString());
    formData.append('simulationPriceMode', simulationPriceMode);
    
    await updateSettings(formData);
    
    setLoading(false);
    setOpen(false);
  }

  async function copyToClipboard(text: string) {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }

  async function handleExport() {
    try {
      const data = await exportDatabase();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `budget-wishlist-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export failed:', error);
      setImportStatus({ type: 'error', message: 'Export failed. Please try again.' });
    }
  }

  async function handleImport(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setLoading(true);
      const text = await file.text();
      const result = await importDatabase(text);
      
      if (result.success) {
        setImportStatus({ type: 'success', message: 'Database imported successfully!' });
        setTimeout(() => {
          window.location.reload();
        }, 1500);
      } else {
        setImportStatus({ type: 'error', message: result.error || 'Import failed' });
      }
    } catch (error) {
      console.error('Import failed:', error);
      setImportStatus({ type: 'error', message: 'Failed to read file. Please check the format.' });
    } finally {
      setLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Settings</DialogTitle>
          <DialogDescription className="text-slate-500">
            Customize your budget and wishlist preferences.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 max-h-[80vh] overflow-y-auto pr-2">
          <div className="space-y-3">
            <Label className="text-slate-700 font-medium">Currency Symbol</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {COMMON_CURRENCIES.map((cur) => (
                <button
                  key={cur.code}
                  type="button"
                  onClick={() => {
                    setCurrency(cur.code);
                    setCustomCurrency('');
                  }}
                  className={`px-4 py-2 rounded-xl border-2 transition-all text-left ${
                    currency === cur.code && !customCurrency
                      ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                      : 'border-slate-100 bg-white hover:border-purple-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-bold text-lg">{cur.code}</div>
                  <div className="text-[10px] uppercase tracking-wider opacity-70">{cur.name}</div>
                </button>
              ))}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="customCurrency" className="text-slate-700 font-medium">Custom Currency</Label>
            <Input
              id="customCurrency"
              placeholder="e.g., kr, ₹, etc."
              value={customCurrency}
              onChange={(e) => setCustomCurrency(e.target.value)}
              className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
            />
            <p className="text-xs text-slate-500 italic">
              Leave empty to use a common currency above, or enter your own symbol.
            </p>
          </div>

          <div className="bg-purple-50 rounded-xl p-4 border border-purple-100">
            <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">Preview Output</div>
            <div className="text-2xl font-bold text-purple-900">
              {customCurrency || currency}1,234.56
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div>
              <Label className="text-slate-700 font-medium mb-3 block">Simulation Price Mode</Label>
              <p className="text-xs text-slate-500 mb-4">
                When simulating purchases with price ranges, choose which price to use for budget calculations.
              </p>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSimulationPriceMode('min')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-center ${
                    simulationPriceMode === 'min'
                      ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                      : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-bold text-sm">Min</div>
                  <div className="text-[10px] text-slate-500 mt-1">Lowest</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationPriceMode('max')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-center ${
                    simulationPriceMode === 'max'
                      ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                      : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-bold text-sm">Max</div>
                  <div className="text-[10px] text-slate-500 mt-1">Highest</div>
                </button>
                <button
                  type="button"
                  onClick={() => setSimulationPriceMode('average')}
                  className={`px-4 py-3 rounded-lg border-2 transition-all text-center ${
                    simulationPriceMode === 'average'
                      ? 'border-purple-400 bg-purple-50 text-purple-700 ring-2 ring-purple-100'
                      : 'border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="font-bold text-sm">Average</div>
                  <div className="text-[10px] text-slate-500 mt-1">Middle</div>
                </button>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <Label className="text-slate-700 font-medium flex items-center gap-2">
                  <Key className="h-4 w-4" />
                  API Access
                </Label>
                <button
                  type="button"
                  onClick={() => setApiEnabled(!apiEnabled)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    apiEnabled ? 'bg-purple-400' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      apiEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
              
              <p className="text-xs text-slate-500 mb-4">
                Enable API access to allow external applications to interact with your data.
              </p>

              {apiEnabled && apiSecret && (
                <div className="bg-slate-50 border border-slate-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700">API Secret</span>
                    <button
                      type="button"
                      onClick={() => setShowApiSecret(!showApiSecret)}
                      className="text-slate-500 hover:text-slate-700 transition-colors"
                    >
                      {showApiSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  
                  <div className="relative">
                    <code className="block bg-slate-900 text-green-400 px-3 py-2 rounded text-xs font-mono break-all">
                      {showApiSecret ? apiSecret : '•'.repeat(apiSecret.length)}
                    </code>
                    {showApiSecret && (
                      <button
                        type="button"
                        onClick={() => copyToClipboard(apiSecret)}
                        className="absolute top-2 right-2 p-1 bg-slate-700 hover:bg-slate-600 rounded transition-colors"
                        title="Copy to clipboard"
                      >
                        {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3 text-slate-300" />}
                      </button>
                    )}
                  </div>

                  <div className="space-y-2 text-xs text-slate-600">
                    <p className="font-semibold">Usage in API requests:</p>
                    <div className="bg-white border border-slate-200 rounded p-2">
                      <p className="font-mono">Authorization: Bearer {showApiSecret ? apiSecret : '***'}</p>
                      <p className="text-slate-400 mt-1">or</p>
                      <p className="font-mono">X-API-Secret: {showApiSecret ? apiSecret : '***'}</p>
                    </div>
                  </div>
                </div>
              )}

              {apiEnabled && !apiSecret && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-amber-800">
                      <p className="font-semibold mb-1">API Secret Not Configured</p>
                      <p>Add <code className="bg-amber-100 px-1 rounded">API_SECRET</code> to your <code className="bg-amber-100 px-1 rounded">.env</code> file to enable API access.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Storage Cleanup */}
          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div>
              <Label className="text-slate-700 font-medium mb-3 block">Storage Cleanup</Label>
              <p className="text-xs text-slate-500 mb-4">
                Remove icon files that are no longer used by any items
              </p>
              
              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCleanup}
                  disabled={cleaningUp}
                  className="flex-1 border-orange-300 text-orange-700 hover:bg-orange-50 transition-colors"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  {cleaningUp ? 'Cleaning...' : 'Cleanup Unused Icons'}
                </Button>
              </div>

              {cleanupStatus && (
                <div className={`rounded-lg p-3 border-2 flex items-start gap-2 mt-3 ${
                  cleanupStatus.type === 'success' 
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                    : 'bg-rose-50 border-rose-300 text-rose-800'
                }`}>
                  <p className="text-sm font-medium">{cleanupStatus.message}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border-t border-slate-200 pt-6 space-y-4">
            <div>
              <Label className="text-slate-700 font-medium mb-3 block">Database Backup</Label>
              <p className="text-xs text-slate-500 mb-4">
                Export your data to a JSON file or import from a previous backup.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleExport}
                  className="flex-1 border-emerald-300 text-emerald-700 hover:bg-emerald-50 transition-colors"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Export Database
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading}
                  className="flex-1 border-blue-300 text-blue-700 hover:bg-blue-50 transition-colors"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Import Database
                </Button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </div>
            </div>

            {importStatus && (
              <div className={`rounded-lg p-3 border-2 flex items-start gap-2 ${
                importStatus.type === 'success' 
                  ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                  : 'bg-rose-50 border-rose-300 text-rose-800'
              }`}>
                {importStatus.type === 'error' && <AlertTriangle className="h-5 w-5 flex-shrink-0 mt-0.5" />}
                <p className="text-sm font-medium">{importStatus.message}</p>
              </div>
            )}

            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  <strong>Warning:</strong> Importing will replace all current data. Make sure to export your current database first!
                </p>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-300">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="bg-purple-400 hover:bg-purple-500 text-white transition-colors px-8">
              {loading ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
