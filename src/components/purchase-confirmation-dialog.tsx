'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, AlertTriangle } from 'lucide-react';
import { NegativeBudgetWarningDialog } from './negative-budget-warning-dialog';

type AdditionalCost = {
  name: string;
  amount: number;
};

type PurchaseConfirmationDialogProps = {
  item: {
    name: string;
    price: number;
    priceMode?: 'fixed' | 'range';
    minPrice?: number | null;
    maxPrice?: number | null;
    additionalCosts?: string | null;
  };
  availableBudget: number;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (deductFromBudget: boolean, customAmount?: number) => void;
  loading: boolean;
};

export function PurchaseConfirmationDialog({
  item,
  availableBudget,
  currency,
  open,
  onOpenChange,
  onConfirm,
  loading,
}: PurchaseConfirmationDialogProps) {
  const [deductionMode, setDeductionMode] = useState<'full' | 'custom' | 'none'>('full');
  const [customAmount, setCustomAmount] = useState('');
  const [showNegativeWarning, setShowNegativeWarning] = useState(false);
  const [pendingConfirmAction, setPendingConfirmAction] = useState<(() => void) | null>(null);

  // Parse additional costs
  const additionalCosts: AdditionalCost[] = item.additionalCosts
    ? (() => {
        try {
          return JSON.parse(item.additionalCosts);
        } catch {
          return [];
        }
      })()
    : [];

  const totalAdditionalCosts = additionalCosts.reduce((sum, cost) => sum + cost.amount, 0);

  // Calculate prices
  const priceMode = item.priceMode || 'fixed';
  const baseMin = priceMode === 'range' && item.minPrice !== null && item.minPrice !== undefined
    ? item.minPrice
    : item.price;
  const baseMax = priceMode === 'range' && item.maxPrice !== null && item.maxPrice !== undefined
    ? item.maxPrice
    : item.price;

  const minTotal = baseMin + totalAdditionalCosts;
  const maxTotal = baseMax + totalAdditionalCosts;

  // Check budget
  const hasEnoughForMin = availableBudget >= minTotal;
  const hasEnoughForMax = availableBudget >= maxTotal;

  const handleConfirm = () => {
    let deductAmount: number | undefined;
    let willDeduct = false;

    if (deductionMode === 'full') {
      willDeduct = true;
      deductAmount = priceMode === 'range' ? minTotal : minTotal;
    } else if (deductionMode === 'custom') {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount <= 0) {
        return; // Invalid custom amount
      }
      willDeduct = true;
      deductAmount = amount;
    } else {
      // mode === 'none'
      willDeduct = false;
      deductAmount = undefined;
    }

    // Check if this will result in negative budget
    if (willDeduct && deductAmount !== undefined) {
      const resultingBudget = availableBudget - deductAmount;
      if (resultingBudget < 0) {
        // Show warning dialog
        setPendingConfirmAction(() => () => {
          onConfirm(willDeduct, deductAmount);
          setDeductionMode('full');
          setCustomAmount('');
        });
        setShowNegativeWarning(true);
        return;
      }
    }

    // Proceed without warning
    onConfirm(willDeduct, deductAmount);
    setDeductionMode('full');
    setCustomAmount('');
  };

  const calculateDeductionAmount = () => {
    if (deductionMode === 'full') {
      return minTotal;
    } else if (deductionMode === 'custom') {
      const amount = parseFloat(customAmount);
      return isNaN(amount) ? 0 : amount;
    }
    return 0;
  };

  const deductionAmount = calculateDeductionAmount();
  const resultingBudget = availableBudget - deductionAmount;

  return (
    <>
      <NegativeBudgetWarningDialog
        open={showNegativeWarning}
        onOpenChange={setShowNegativeWarning}
        onConfirm={() => {
          if (pendingConfirmAction) {
            pendingConfirmAction();
            setPendingConfirmAction(null);
          }
        }}
        currentBudget={availableBudget}
        operationAmount={deductionAmount}
        resultingBudget={resultingBudget}
        currency={currency}
        operationType="purchase"
      />

      <Dialog open={open} onOpenChange={(newOpen) => {
        onOpenChange(newOpen);
        if (!newOpen) {
          setDeductionMode('full');
          setCustomAmount('');
        }
      }}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Check className="h-5 w-5 text-green-500" />
              Purchase Item
            </DialogTitle>
            <DialogDescription>
              Mark this item as purchased and optionally deduct from budget.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Price Breakdown */}
            <div className="bg-slate-50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-600">Item:</span>
                <span className="font-semibold text-slate-900">{item.name}</span>
              </div>
              
              <div className="border-t border-slate-200 pt-2 space-y-1">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-slate-600">Base Price:</span>
                  <span className="font-semibold text-slate-900">
                    {priceMode === 'range'
                      ? `${currency}${baseMin.toFixed(2)} - ${currency}${baseMax.toFixed(2)}`
                      : `${currency}${item.price.toFixed(2)}`}
                  </span>
                </div>
                
                {additionalCosts.map((cost, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-xs text-slate-500">{cost.name}:</span>
                    <span className="text-sm text-slate-700">
                      +{currency}{cost.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
                
                <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                  <span className="text-sm font-medium text-slate-700">Total:</span>
                  <span className="font-bold text-lg text-purple-600">
                    {priceMode === 'range'
                      ? `${currency}${minTotal.toFixed(2)} - ${currency}${maxTotal.toFixed(2)}`
                      : `${currency}${minTotal.toFixed(2)}`}
                  </span>
                </div>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600">Available Budget:</span>
                <span className={`font-bold ${availableBudget >= 0 ? (hasEnoughForMax ? 'text-green-600' : hasEnoughForMin ? 'text-amber-600' : 'text-red-600') : 'text-red-600'}`}>
                  {availableBudget >= 0 ? '' : '-'}{currency}{Math.abs(availableBudget).toFixed(2)}
                </span>
              </div>
            </div>
            
            {availableBudget < 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-red-900 mb-1">Current Deficit</p>
                  <p className="text-sm text-red-700">
                    Your budget is currently in deficit by {currency}{Math.abs(availableBudget).toFixed(2)}.
                  </p>
                </div>
              </div>
            )}

            {availableBudget >= 0 && !hasEnoughForMin && (
              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="font-semibold text-amber-900 mb-1">Insufficient Budget</p>
                  <p className="text-sm text-amber-700">
                    You&apos;re short by {currency}{(minTotal - availableBudget).toFixed(2)}. Deducting will result in a deficit.
                  </p>
                </div>
              </div>
            )}

            {/* Deduction Options */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold text-slate-700">
                Budget Deduction Options:
              </Label>
              
              <div className="space-y-2">
                {/* Full Price Deduction */}
                <div
                  onClick={() => setDeductionMode('full')}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    deductionMode === 'full'
                      ? 'border-green-500 bg-green-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        deductionMode === 'full' ? 'border-green-500' : 'border-slate-300'
                      }`}>
                        {deductionMode === 'full' && (
                          <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Deduct Full Price</p>
                      <p className="text-sm text-slate-600">
                        Deduct {currency}{minTotal.toFixed(2)} from budget
                      </p>
                    </div>
                  </div>
                </div>

                {/* Custom Amount Deduction */}
                <div
                  onClick={() => setDeductionMode('custom')}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    deductionMode === 'custom'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        deductionMode === 'custom' ? 'border-blue-500' : 'border-slate-300'
                      }`}>
                        {deductionMode === 'custom' && (
                          <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1 space-y-2">
                      <div>
                        <p className="font-medium text-slate-900">Deduct Custom Amount</p>
                        <p className="text-sm text-slate-600">
                          Specify a different amount to deduct
                        </p>
                      </div>
                      {deductionMode === 'custom' && (
                        <Input
                          type="number"
                          step="0.01"
                          min="0"
                          placeholder="0.00"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="border-slate-300 focus:border-blue-400 focus:ring-blue-400"
                          onClick={(e) => e.stopPropagation()}
                        />
                      )}
                    </div>
                  </div>
                </div>

                {/* No Deduction */}
                <div
                  onClick={() => setDeductionMode('none')}
                  className={`border-2 rounded-lg p-3 cursor-pointer transition-all ${
                    deductionMode === 'none'
                      ? 'border-purple-500 bg-purple-50'
                      : 'border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                        deductionMode === 'none' ? 'border-purple-500' : 'border-slate-300'
                      }`}>
                        {deductionMode === 'none' && (
                          <div className="w-2 h-2 rounded-full bg-purple-500"></div>
                        )}
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-slate-900">Don&apos;t Deduct</p>
                      <p className="text-sm text-slate-600">
                        Mark as purchased without affecting budget
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Preview resulting budget */}
              {deductionMode !== 'none' && (
                <div className="bg-slate-100 rounded-lg p-3 border border-slate-200">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-600">Resulting Budget:</span>
                    <span className={`font-bold ${resultingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {resultingBudget >= 0 ? '' : '-'}{currency}{Math.abs(resultingBudget).toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={() => onOpenChange(false)}
                disabled={loading}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={loading || (deductionMode === 'custom' && (!customAmount || parseFloat(customAmount) <= 0))}
                className="flex-1 bg-green-500 hover:bg-green-600 text-white"
              >
                <Check className="h-4 w-4 mr-2" />
                Confirm Purchase
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
