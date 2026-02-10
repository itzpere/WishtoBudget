'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Check, X, Pencil, Trash2, ExternalLink, Calendar, TrendingUp, DollarSign } from 'lucide-react';
import { EditItemDialog } from './edit-item-dialog';
import { PurchaseConfirmationDialog } from './purchase-confirmation-dialog';
import { UnpurchaseConfirmationDialog } from './unpurchase-confirmation-dialog';
import { DeleteItemDialog } from './delete-item-dialog';

type ItemDetailsDialogProps = {
  item: {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    priceMode?: 'fixed' | 'range';
    minPrice?: number | null;
    maxPrice?: number | null;
    additionalCosts?: string | null;
    purchasedAmount?: number | null;
    status: 'pending' | 'purchased';
    priority: number;
    link?: string | null;
    imageUrl?: string | null;
    localIconPath?: string | null;
    createdAt?: Date | null;
  };
  wishlistSavings: number;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function ItemDetailsDialog({ 
  item, 
  wishlistSavings, 
  currency,
  open, 
  onOpenChange 
}: ItemDetailsDialogProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [purchaseDialogOpen, setPurchaseDialogOpen] = useState(false);
  const [unpurchaseDialogOpen, setUnpurchaseDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [localImageError, setLocalImageError] = useState(false);

  // Parse additional costs
  const additionalCosts = item.additionalCosts ? (() => {
    try {
      return JSON.parse(item.additionalCosts);
    } catch {
      return [];
    }
  })() : [];

  const totalAdditionalCosts = additionalCosts.reduce((sum: number, cost: { amount: number }) => sum + cost.amount, 0);

  // Calculate totals
  const isRangeMode = item.priceMode === 'range';
  const minTotal = isRangeMode && item.minPrice !== null && item.minPrice !== undefined
    ? item.minPrice + totalAdditionalCosts
    : item.price + totalAdditionalCosts;
  const maxTotal = isRangeMode && item.maxPrice !== null && item.maxPrice !== undefined
    ? item.maxPrice + totalAdditionalCosts
    : item.price + totalAdditionalCosts;

  // Affordability calculation
  const canAffordMin = wishlistSavings >= minTotal;
  const canAffordMax = wishlistSavings >= maxTotal;
  const affordabilityPercentage = Math.max(0, Math.min((wishlistSavings / minTotal) * 100, 100));

  const handleDeleteClick = () => {
    setDeleteDialogOpen(true);
  };

  const handleDeleted = () => {
    onOpenChange(false);
  };

  const handlePurchaseClick = () => {
    onOpenChange(false); // Close parent dialog to prevent stacking
    setPurchaseDialogOpen(true);
  };

  const handleUnpurchaseClick = () => {
    setUnpurchaseDialogOpen(true);
  };

  const handleEditClick = () => {
    setEditDialogOpen(true);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">{item.name}</DialogTitle>
            <DialogDescription>
              {item.status === 'purchased' ? (
                <span className="inline-flex items-center gap-1.5 text-green-600 font-medium">
                  <Check className="h-4 w-4" />
                  Purchased
                  {item.purchasedAmount && (
                    <span className="text-sm">
                      {item.purchasedAmount !== (item.price + totalAdditionalCosts) ? (
                        <span className="font-semibold">(Custom: {currency}{item.purchasedAmount.toFixed(2)})</span>
                      ) : (
                        <span>for {currency}{item.purchasedAmount.toFixed(2)}</span>
                      )}
                    </span>
                  )}
                </span>
              ) : (
                <span className="text-slate-500">Pending purchase</span>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Item Image */}
            {((item.imageUrl && !imageError) || (item.localIconPath && !localImageError)) && (
              <div className="flex justify-center">
                <img
                  src={
                    (item.imageUrl && !imageError) 
                      ? item.imageUrl 
                      : item.localIconPath || ''
                  }
                  alt={item.name}
                  className="max-h-80 w-auto rounded-lg object-contain border-2 border-slate-200"
                  onError={() => {
                    if (item.imageUrl && !imageError) {
                      setImageError(true);
                    } else if (item.localIconPath && !localImageError) {
                      setLocalImageError(true);
                    }
                  }}
                />
              </div>
            )}

            {/* Description */}
            {item.description && (
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <h4 className="font-semibold text-slate-700 mb-2 text-sm uppercase tracking-wide">Description</h4>
                <p className="text-slate-700 leading-relaxed">{item.description}</p>
              </div>
            )}

            {/* Price Information */}
            <div className="p-4 bg-purple-50 border-2 border-purple-200 rounded-lg space-y-3">
              <h4 className="font-bold text-purple-700 mb-2 text-sm uppercase tracking-wide flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Price Breakdown
              </h4>
              
              <div className="space-y-2">
                {/* Base Price */}
                <div className="flex items-center justify-between">
                  <span className="text-slate-600 font-medium">Base Price:</span>
                  <span className="text-lg font-bold text-slate-800">
                    {isRangeMode && item.minPrice !== null && item.maxPrice !== null && item.minPrice !== undefined && item.maxPrice !== undefined
                      ? `${currency}${item.minPrice.toFixed(2)} - ${currency}${item.maxPrice.toFixed(2)}`
                      : `${currency}${item.price.toFixed(2)}`}
                  </span>
                </div>

                {/* Visual Range Indicator */}
                {isRangeMode && item.minPrice !== null && item.maxPrice !== null && item.minPrice !== undefined && item.maxPrice !== undefined && (
                  <div className="py-2">
                    <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden">
                      <div className="absolute inset-0 bg-linear-to-r from-purple-200 to-purple-300" />
                      <div 
                        className="absolute inset-y-0 left-0 bg-linear-to-r from-green-300 to-green-400 flex items-center justify-end pr-2"
                        style={{ width: `${(item.minPrice / item.maxPrice) * 100}%` }}
                      >
                        <span className="text-xs font-bold text-green-800">Min</span>
                      </div>
                      <div className="absolute inset-y-0 right-0 flex items-center pr-2">
                        <span className="text-xs font-bold text-purple-800">Max</span>
                      </div>
                    </div>
                    <div className="flex justify-between mt-1 text-xs text-slate-500">
                      <span>Minimum Budget</span>
                      <span>Maximum Budget</span>
                    </div>
                  </div>
                )}

                {/* Additional Costs */}
                {additionalCosts.length > 0 && (
                  <>
                    {additionalCosts.map((cost: { name: string; amount: number }, index: number) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <span className="text-slate-600">{cost.name}:</span>
                        <span className="text-slate-700 font-medium">
                          +{currency}{cost.amount.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </>
                )}

                {/* Total Price */}
                <div className="flex items-center justify-between pt-2 border-t-2 border-purple-200">
                  <span className="text-purple-700 font-bold">Total Price:</span>
                  <span className="text-2xl font-bold text-purple-600">
                    {isRangeMode
                      ? `${currency}${minTotal.toFixed(2)} - ${currency}${maxTotal.toFixed(2)}`
                      : `${currency}${minTotal.toFixed(2)}`}
                  </span>
                </div>
              </div>
            </div>

            {/* Affordability Status (only for pending items) */}
            {item.status !== 'purchased' && (
              <div className={`p-4 rounded-lg border-2 ${
                canAffordMax 
                  ? 'bg-green-50 border-green-200' 
                  : canAffordMin 
                    ? 'bg-yellow-50 border-yellow-200'
                    : 'bg-red-50 border-red-200'
              }`}>
                <h4 className={`font-bold mb-2 text-sm uppercase tracking-wide flex items-center gap-2 ${
                  canAffordMax ? 'text-green-700' : canAffordMin ? 'text-yellow-700' : 'text-red-700'
                }`}>
                  <TrendingUp className="h-4 w-4" />
                  Affordability Status
                </h4>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-600 font-medium">Available Budget:</span>
                    <span className="text-lg font-bold text-slate-800">
                      {currency}{wishlistSavings.toFixed(2)}
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div className="relative h-4 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className={`absolute inset-y-0 left-0 transition-all duration-500 ${
                        canAffordMax ? 'bg-green-500' : canAffordMin ? 'bg-yellow-500' : 'bg-red-500'
                      }`}
                      style={{ width: `${Math.min(affordabilityPercentage, 100)}%` }}
                    />
                  </div>

                  <div className="text-sm">
                    {canAffordMax ? (
                      <p className="text-green-700 font-medium">
                        ✓ You can afford this item! {isRangeMode && 'Even at maximum price.'}
                      </p>
                    ) : canAffordMin ? (
                      <p className="text-yellow-700 font-medium">
                        ⚠ You can afford the minimum price, but not the maximum.
                      </p>
                    ) : (
                      <p className="text-red-700 font-medium">
                        ✗ Insufficient budget. Need {currency}{(minTotal - wishlistSavings).toFixed(2)} more.
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* Additional Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Priority */}
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-medium">Priority</span>
                <span className="text-xl font-bold text-purple-600">{item.priority}</span>
              </div>

              {/* Created Date */}
              {item.createdAt && (
                <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-slate-600 font-medium flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Added On
                  </span>
                  <span className="text-sm font-medium text-slate-700">
                    {new Date(item.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </span>
                </div>
              )}
            </div>

            {/* Link */}
            {item.link && (
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                <span className="text-slate-600 font-medium">Product Link</span>
                <a
                  href={item.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-purple-400 hover:text-purple-500 flex items-center gap-1 font-medium transition-colors"
                >
                  Open Link
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 pt-4 border-t-2 border-slate-200">
              {item.status !== 'purchased' ? (
                <Button
                  onClick={handlePurchaseClick}
                  className="flex-1 bg-green-500 hover:bg-green-600 text-white"
                >
                  <Check className="h-4 w-4 mr-2" />
                  Purchase
                </Button>
              ) : (
                <Button
                  onClick={handleUnpurchaseClick}
                  className="flex-1 bg-red-500 hover:bg-red-600 text-white"
                >
                  <X className="h-4 w-4 mr-2" />
                  Unpurchase
                </Button>
              )}
              <Button
                onClick={handleEditClick}
                variant="outline"
                className="flex-1 border-purple-400 text-purple-400 hover:bg-purple-50"
              >
                <Pencil className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                onClick={handleDeleteClick}
                variant="outline"
                className="flex-1 border-red-500 text-red-500 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Nested Dialogs */}
      <EditItemDialog
        item={item}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
      />

      <PurchaseConfirmationDialog
        item={{
          name: item.name,
          price: item.price,
          priceMode: item.priceMode,
          minPrice: item.minPrice,
          maxPrice: item.maxPrice,
          additionalCosts: item.additionalCosts,
        }}
        availableBudget={wishlistSavings}
        currency={currency}
        open={purchaseDialogOpen}
        onOpenChange={setPurchaseDialogOpen}
        onConfirm={async (deductFromBudget, customAmount) => {
          const { purchaseItem } = await import('@/app/actions');
          await purchaseItem(item.id, deductFromBudget, customAmount);
          setPurchaseDialogOpen(false);
          onOpenChange(false);
        }}
        loading={false}
      />

      <UnpurchaseConfirmationDialog
        item={{
          name: item.name,
          price: item.price,
        }}
        currency={currency}
        open={unpurchaseDialogOpen}
        onOpenChange={setUnpurchaseDialogOpen}
        onConfirm={async (addBackToBudget) => {
          const { unpurchaseItem } = await import('@/app/actions');
          await unpurchaseItem(item.id, addBackToBudget);
          setUnpurchaseDialogOpen(false);
          onOpenChange(false);
        }}
        loading={false}
      />

      <DeleteItemDialog
        item={{
          id: item.id,
          name: item.name,
        }}
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onDeleted={handleDeleted}
      />
    </>
  );
}
