'use client';

import { cn } from '@/lib/utils';
import { useState } from 'react';
import { ItemDetailsDialog } from './item-details-dialog';
import { PriceBreakdownPopover } from './price-breakdown-popover';

type BatteryItemCardProps = {
  item: {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    priceMode?: 'fixed' | 'range';
    minPrice?: number | null;
    maxPrice?: number | null;
    additionalCosts?: string | null;
    status: 'pending' | 'purchased';
    priority: number;
    link?: string | null;
    imageUrl?: string | null;
    localIconPath?: string | null;
  };
  wishlistSavings: number;
  currency: string;
  isSimulationMode?: boolean;
  isSelected?: boolean;
  onToggleSelect?: () => void;
};

export function BatteryItemCard({ 
  item, 
  wishlistSavings, 
  currency, 
  isSimulationMode = false,
  isSelected = false,
  onToggleSelect 
}: BatteryItemCardProps) {
  const [imageError, setImageError] = useState(false);
  const [localImageError, setLocalImageError] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  
  // Calculate total costs including additional costs
  const calculateTotalCost = (basePrice: number) => {
    let total = basePrice;
    if (item.additionalCosts) {
      try {
        const costs = JSON.parse(item.additionalCosts);
        costs.forEach((cost: { name: string; amount: number }) => {
          total += cost.amount;
        });
      } catch (e) {
        // Invalid JSON, use base price only
      }
    }
    return total;
  };

  const isRangeMode = item.priceMode === 'range';
  const minTotal = isRangeMode ? calculateTotalCost(item.minPrice || item.price) : calculateTotalCost(item.price);
  const maxTotal = isRangeMode ? calculateTotalCost(item.maxPrice || item.price) : calculateTotalCost(item.price);
  
  // Calculate the "charge" percentage
  let minChargePercentage: number;
  let maxChargePercentage: number;
  let isCompleted: boolean;
  
  if (item.status === 'purchased') {
    // Purchased items are always full
    minChargePercentage = 100;
    maxChargePercentage = 100;
    isCompleted = true;
  } else if (isSimulationMode && isSelected) {
    // Selected items in simulation mode show as full (green) - "bought"
    minChargePercentage = 100;
    maxChargePercentage = 100;
    isCompleted = true;
  } else {
    // Unselected items (or normal mode) calculate from available budget
    if (isRangeMode) {
      minChargePercentage = Math.min((wishlistSavings / minTotal) * 100, 100);
      maxChargePercentage = Math.min((wishlistSavings / maxTotal) * 100, 100);
      isCompleted = maxChargePercentage >= 100;
    } else {
      minChargePercentage = Math.min((wishlistSavings / minTotal) * 100, 100);
      maxChargePercentage = minChargePercentage;
      isCompleted = minChargePercentage >= 100;
    }
  }
  
  const handleCardClick = () => {
    if (isSimulationMode && item.status === 'pending') {
      // In simulation mode, toggle selection instead of opening details
      onToggleSelect?.();
    } else {
      // Normal mode or purchased items open details dialog
      setDetailsDialogOpen(true);
    }
  };
  
  // Check if this selected item is causing over-budget
  const isOverBudget = isSimulationMode && isSelected && wishlistSavings < 0;
  
  return (
    <>
      <div
        onClick={handleCardClick}
        className={cn(
          "relative aspect-square rounded-[2.5rem] overflow-hidden transition-all duration-500 cursor-pointer hover:scale-105",
          isCompleted 
            ? "border-4 border-green-400 rounded-[3rem] shadow-lg shadow-green-200" 
            : "border-2 border-slate-200 hover:border-purple-300 hover:shadow-xl",
          isSimulationMode && isSelected && "border-4 border-purple-500 shadow-xl shadow-purple-300 scale-95",
          isOverBudget && "border-red-500 animate-pulse shadow-red-300"
        )}
      >
        {/* Selection Indicator for Simulation Mode */}
        {isSimulationMode && isSelected && item.status === 'pending' && (
          <div className="absolute top-3 right-3 z-20 bg-purple-500 text-white rounded-full p-2 shadow-lg">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        )}

        {/* Battery Fill Background */}
        <div className="absolute inset-0">
          {/* Solid background */}
          <div className="absolute inset-0 bg-white" />
          
          {isCompleted ? (
            // Full background fill when completed
            <div className="absolute inset-0 bg-green-300/80" />
          ) : isRangeMode && !isSimulationMode ? (
            // Dual-layer fill for range mode
            <>
              {/* Max price layer (gray background) */}
              <div 
                className="absolute bottom-0 left-0 right-0 overflow-hidden"
                style={{ height: `${maxChargePercentage}%` }}
              >
                <svg
                  className="absolute bottom-0 left-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,100 L0,20 Q25,10 50,20 T100,20 L100,100 Z"
                    fill="rgb(203 213 225)"
                    className="animate-[wave-fill_3s_ease-in-out_infinite]"
                  />
                </svg>
              </div>
              {/* Min price layer (green foreground) */}
              <div 
                className="absolute bottom-0 left-0 right-0 overflow-hidden"
                style={{ height: `${minChargePercentage}%` }}
              >
                <svg
                  className="absolute bottom-0 left-0 w-full h-full"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0,100 L0,20 Q25,10 50,20 T100,20 L100,100 Z"
                    fill="rgb(134 239 172)"
                    className="animate-[wave-fill_3s_ease-in-out_infinite]"
                  />
                </svg>
              </div>
            </>
          ) : (
            // Single wavy fill for fixed mode
            <div 
              className="absolute bottom-0 left-0 right-0 overflow-hidden"
              style={{ height: `${minChargePercentage}%` }}
            >
              <svg
                className="absolute bottom-0 left-0 w-full h-full"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                <path
                  d="M0,100 L0,20 Q25,10 50,20 T100,20 L100,100 Z"
                  fill="rgb(134 239 172)"
                  className="animate-[wave-fill_3s_ease-in-out_infinite]"
                />
              </svg>
            </div>
          )}
        </div>
        
        {/* Content */}
        <div className="relative h-full flex flex-col items-center justify-center p-4 text-center gap-2">
          {/* Item Image */}
          {((item.imageUrl && !imageError) || (item.localIconPath && !localImageError)) && (
            <div className="w-24 h-24 bg-white/95 backdrop-blur-sm rounded-xl shadow-sm overflow-hidden flex-shrink-0">
              <img
                src={
                  (item.imageUrl && !imageError) 
                    ? item.imageUrl 
                    : item.localIconPath || ''
                }
                alt={item.name}
                className="w-full h-full object-cover"
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
          
          {/* Item Name */}
          <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm">
            <h3 className={cn(
              "text-xl font-bold transition-colors z-10",
              isCompleted ? "text-green-800" : "text-slate-800 group-hover:text-purple-600"
            )}>
              {item.name}
            </h3>
          </div>
          
          {/* Price */}
          <PriceBreakdownPopover
            priceMode={item.priceMode || 'fixed'}
            price={item.price}
            minPrice={item.minPrice}
            maxPrice={item.maxPrice}
            additionalCosts={item.additionalCosts}
            currency={currency}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-xl px-4 py-2 shadow-sm cursor-help">
              <p className={cn(
                "text-lg font-bold z-10",
                isCompleted ? "text-green-700" : "text-slate-700"
              )}>
                {isRangeMode 
                  ? `${currency}${minTotal.toFixed(2)} - ${currency}${maxTotal.toFixed(2)}`
                  : `${currency}${minTotal.toFixed(2)}`
                }
              </p>
            </div>
          </PriceBreakdownPopover>

          
          {/* Glow Effect for Completed */}
          {isCompleted && (
            <div className="absolute inset-0 bg-linear-to-t from-green-400/20 to-transparent pointer-events-none" />
          )}
        </div>
        
        {/* Status Indicator */}
        {item.status === 'purchased' && (
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-sm text-green-700 text-sm font-bold px-4 py-1.5 rounded-full shadow-sm">
            Purchased
          </div>
        )}
      </div>
      
      {/* Item Details Dialog */}
      <ItemDetailsDialog
        item={item}
        wishlistSavings={wishlistSavings}
        currency={currency}
        open={detailsDialogOpen}
        onOpenChange={setDetailsDialogOpen}
      />
    </>
  );
}
