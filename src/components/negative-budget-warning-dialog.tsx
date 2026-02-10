'use client';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

type NegativeBudgetWarningDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  currentBudget: number;
  operationAmount: number;
  resultingBudget: number;
  currency: string;
  operationType: 'purchase' | 'deduction' | 'budget-update';
};

export function NegativeBudgetWarningDialog({
  open,
  onOpenChange,
  onConfirm,
  currentBudget,
  operationAmount,
  resultingBudget,
  currency,
  operationType,
}: NegativeBudgetWarningDialogProps) {
  const getOperationText = () => {
    switch (operationType) {
      case 'purchase':
        return 'Purchasing this item';
      case 'deduction':
        return 'Deducting this amount';
      case 'budget-update':
        return 'This budget operation';
      default:
        return 'This operation';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-600">
            <AlertTriangle className="h-5 w-5" />
            Negative Budget Warning
          </DialogTitle>
          <DialogDescription>
            This operation will result in a negative budget (deficit).
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="rounded-lg bg-red-50 border border-red-200 p-4 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Current Budget:</span>
              <span className={`font-semibold ${currentBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {currentBudget >= 0 ? '' : '-'}{currency}{Math.abs(currentBudget).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Operation Amount:</span>
              <span className="font-semibold text-gray-900">
                -{currency}{operationAmount.toFixed(2)}
              </span>
            </div>
            <div className="border-t border-red-300 pt-3 flex justify-between items-center">
              <span className="text-sm font-bold text-gray-900">Resulting Budget:</span>
              <span className="font-bold text-red-600 text-lg">
                -{currency}{Math.abs(resultingBudget).toFixed(2)}
              </span>
            </div>
          </div>

          <div className="text-sm text-gray-600 space-y-2">
            <p>
              <strong>{getOperationText()}</strong> will cause your budget to go into deficit.
            </p>
            <p>
              You&apos;ll need to add {currency}{Math.abs(resultingBudget).toFixed(2)} to return to a positive balance.
            </p>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={() => {
              onConfirm();
              onOpenChange(false);
            }}
            className="bg-red-600 hover:bg-red-700"
          >
            Proceed Anyway
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
