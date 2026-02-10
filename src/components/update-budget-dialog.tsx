'use client';

import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateBudget } from '@/app/actions';
import { Plus, Minus, Replace } from 'lucide-react';
import { NegativeBudgetWarningDialog } from './negative-budget-warning-dialog';

type Wishlist = {
  id: number;
  name: string;
  description: string | null;
  budgetLimit: number;
};

type UpdateBudgetDialogProps = {
  children: React.ReactNode;
  wishlists: Wishlist[];
  defaultWishlistId?: number;
  currency: string;
};

export function UpdateBudgetDialog({ children, wishlists, defaultWishlistId, currency }: UpdateBudgetDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWishlistId, setSelectedWishlistId] = useState('');
  const [showNegativeWarning, setShowNegativeWarning] = useState(false);
  const [pendingOperation, setPendingOperation] = useState<{ operation: 'add' | 'remove' | 'overwrite'; amount: number } | null>(null);

  // Set default wishlist when dialog opens
  useEffect(() => {
    if (open && defaultWishlistId && !selectedWishlistId) {
      setSelectedWishlistId(defaultWishlistId.toString());
    }
  }, [open, defaultWishlistId, selectedWishlistId]);

  const selectedWishlist = wishlists.find(w => w.id.toString() === selectedWishlistId);

  async function handleOperation(operation: 'add' | 'remove' | 'overwrite') {
    const amountInput = document.getElementById('amount') as HTMLInputElement;
    const amount = parseFloat(amountInput.value);
    
    if (!selectedWishlistId || !amount || amount <= 0) {
      return;
    }

    if (!selectedWishlist) {
      return;
    }

    // Calculate resulting budget
    let resultingBudget: number;
    switch (operation) {
      case 'add':
        resultingBudget = selectedWishlist.budgetLimit + amount;
        break;
      case 'remove':
        resultingBudget = selectedWishlist.budgetLimit - amount;
        break;
      case 'overwrite':
        resultingBudget = amount;
        break;
    }

    // Check if operation will result in negative budget
    if (resultingBudget < 0) {
      setPendingOperation({ operation, amount });
      setShowNegativeWarning(true);
      return;
    }

    // Execute operation directly if budget remains positive
    await executeOperation(operation, amount);
  }

  async function executeOperation(operation: 'add' | 'remove' | 'overwrite', amount: number) {
    setLoading(true);
    
    const formData = new FormData();
    formData.append('wishlistId', selectedWishlistId);
    formData.append('amount', amount.toString());
    formData.append('operation', operation);
    
    await updateBudget(formData);
    
    setLoading(false);
    setOpen(false);
    setSelectedWishlistId('');
  }

  const calculateResultingBudget = () => {
    if (!selectedWishlist || !pendingOperation) return 0;
    
    switch (pendingOperation.operation) {
      case 'add':
        return selectedWishlist.budgetLimit + pendingOperation.amount;
      case 'remove':
        return selectedWishlist.budgetLimit - pendingOperation.amount;
      case 'overwrite':
        return pendingOperation.amount;
      default:
        return selectedWishlist.budgetLimit;
    }
  };

  return (
    <>
      <NegativeBudgetWarningDialog
        open={showNegativeWarning}
        onOpenChange={setShowNegativeWarning}
        onConfirm={() => {
          if (pendingOperation) {
            executeOperation(pendingOperation.operation, pendingOperation.amount);
            setPendingOperation(null);
          }
        }}
        currentBudget={selectedWishlist?.budgetLimit || 0}
        operationAmount={pendingOperation?.operation === 'remove' ? pendingOperation.amount : (pendingOperation?.operation === 'overwrite' ? Math.abs((selectedWishlist?.budgetLimit || 0) - (pendingOperation?.amount || 0)) : pendingOperation?.amount || 0)}
        resultingBudget={calculateResultingBudget()}
        currency={currency}
        operationType="budget-update"
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children}
        </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-800">Update Budget</DialogTitle>
          <DialogDescription className="text-slate-500">
            Add to, remove from, or overwrite the budget for a wishlist.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="wishlistId" className="text-slate-700 font-medium">Wishlist</Label>
            <select
              id="wishlistId"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              value={selectedWishlistId}
              onChange={(e) => setSelectedWishlistId(e.target.value)}
              required
            >
              <option value="">Select a wishlist</option>
              {wishlists.map((wishlist) => (
                <option key={wishlist.id} value={wishlist.id}>
                  {wishlist.name} (Current: {currency}{wishlist.budgetLimit.toFixed(2)})
                </option>
              ))}
            </select>
          </div>
          {selectedWishlist && (
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-4 text-sm text-purple-800 flex justify-between items-center">
              <span className="font-medium">Current Budget:</span>
              <span className="text-lg font-bold">{currency}{selectedWishlist.budgetLimit.toFixed(2)}</span>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="amount" className="text-slate-700 font-medium">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              placeholder="0.00"
              className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
              required
            />
          </div>
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Operation</Label>
            <div className="grid grid-cols-3 gap-3">
              <Button
                type="button"
                onClick={() => handleOperation('add')}
                disabled={loading || !selectedWishlistId}
                className="flex flex-col h-auto py-3 gap-1 bg-emerald-500 hover:bg-emerald-600 text-white transition-all group"
              >
                <Plus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Add</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleOperation('remove')}
                disabled={loading || !selectedWishlistId}
                className="flex flex-col h-auto py-3 gap-1 bg-rose-500 hover:bg-rose-600 text-white transition-all group"
              >
                <Minus className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Remove</span>
              </Button>
              <Button
                type="button"
                onClick={() => handleOperation('overwrite')}
                disabled={loading || !selectedWishlistId}
                className="flex flex-col h-auto py-3 gap-1 bg-purple-400 hover:bg-purple-500 text-white transition-all group"
              >
                <Replace className="h-5 w-5 group-hover:scale-110 transition-transform" />
                <span className="text-xs font-semibold">Set New</span>
              </Button>
            </div>
          </div>
          <div className="flex justify-end pt-2 border-t border-slate-100">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="border-slate-300">
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}
