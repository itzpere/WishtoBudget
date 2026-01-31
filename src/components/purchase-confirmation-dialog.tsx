'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Check, DollarSign, AlertTriangle } from 'lucide-react';

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
  const [showCustomAmount, setShowCustomAmount] = useState(false);
  const [customAmount, setCustomAmount] = useState('');

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

  const handleConfirm = (deduct: boolean, useMin?: boolean, useMax?: boolean) => {
    if (showCustomAmount && customAmount) {
      const amount = parseFloat(customAmount);
      if (!isNaN(amount) && amount > 0) {
        onConfirm(deduct, amount);
      }
    } else if (useMin) {
      onConfirm(deduct, minTotal);
    } else if (useMax) {
      onConfirm(deduct, maxTotal);
    } else {
      onConfirm(deduct);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(newOpen) => {
      onOpenChange(newOpen);
      if (!newOpen) {
        setShowCustomAmount(false);
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
              <span className={`font-bold ${hasEnoughForMax ? 'text-green-600' : hasEnoughForMin ? 'text-amber-600' : 'text-red-600'}`}>
                {currency}{availableBudget.toFixed(2)}
              </span>
            </div>
          </div>
          
          {!hasEnoughForMin && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-semibold text-red-900 mb-1">Insufficient Budget</p>
                <p className="text-sm text-red-700">
                  You don't have enough budget. Short by {currency}{(minTotal - availableBudget).toFixed(2)}.
                </p>
              </div>
            </div>
          )}

          {priceMode === 'range' && hasEnoughForMin && !hasEnoughForMax && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3 flex items-start gap-2">
              <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-800">
                You can afford the minimum price but not the maximum.
              </p>
            </div>
          )}

          {/* Custom Amount Option */}
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => setShowCustomAmount(!showCustomAmount)}
              className="text-sm text-purple-600 hover:text-purple-700 font-medium"
            >
              {showCustomAmount ? '← Back to preset amounts' : '💰 Enter custom amount'}
            </button>
            
            {showCustomAmount && (
              <div className="space-y-2 bg-purple-50 rounded-lg p-3 border border-purple-200">
                <Label htmlFor="customAmount" className="text-sm font-medium text-slate-700">
                  Custom Amount
                </Label>
                <Input
                  id="customAmount"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="border-slate-300 focus:border-purple-400 focus:ring-purple-400"
                />
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <p className="text-xs text-slate-600 font-medium uppercase tracking-wide">
              Deduct from Budget:
            </p>
            
            {showCustomAmount ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleConfirm(true)}
                  disabled={loading || !customAmount || parseFloat(customAmount) <= 0}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Deduct {customAmount ? `${currency}${parseFloat(customAmount).toFixed(2)}` : 'Custom Amount'}
                </Button>
                <Button
                  onClick={() => handleConfirm(false)}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Don't Deduct
                </Button>
              </div>
            ) : priceMode === 'range' ? (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleConfirm(true, true, false)}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Deduct Min ({currency}{minTotal.toFixed(2)})
                </Button>
                <Button
                  onClick={() => handleConfirm(true, false, true)}
                  disabled={loading || !hasEnoughForMax}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Deduct Max ({currency}{maxTotal.toFixed(2)})
                </Button>
                <Button
                  onClick={() => handleConfirm(false)}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Don't Deduct
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Button
                  onClick={() => handleConfirm(true)}
                  disabled={loading}
                  className="w-full bg-green-500 hover:bg-green-600 text-white"
                >
                  <DollarSign className="h-4 w-4 mr-2" />
                  Deduct {currency}{minTotal.toFixed(2)}
                </Button>
                <Button
                  onClick={() => handleConfirm(false)}
                  disabled={loading}
                  variant="outline"
                  className="w-full"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Don't Deduct
                </Button>
              </div>
            )}

            <Button
              onClick={() => onOpenChange(false)}
              disabled={loading}
              variant="outline"
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
