'use client';

import { HoverCard, HoverCardContent, HoverCardTrigger } from '@/components/ui/hover-card';

type AdditionalCost = {
  name: string;
  amount: number;
};

type PriceBreakdownPopoverProps = {
  children: React.ReactNode;
  priceMode: 'fixed' | 'range';
  price?: number;
  minPrice?: number | null;
  maxPrice?: number | null;
  additionalCosts?: string | null;
  currency: string;
};

export function PriceBreakdownPopover({
  children,
  priceMode,
  price,
  minPrice,
  maxPrice,
  additionalCosts,
  currency,
}: PriceBreakdownPopoverProps) {
  // Parse additional costs
  const costs: AdditionalCost[] = additionalCosts
    ? (() => {
        try {
          return JSON.parse(additionalCosts);
        } catch {
          return [];
        }
      })()
    : [];

  const totalAdditionalCosts = costs.reduce((sum, cost) => sum + cost.amount, 0);

  // Calculate totals
  const minTotal = priceMode === 'range' && minPrice !== null && minPrice !== undefined
    ? minPrice + totalAdditionalCosts
    : (price || 0) + totalAdditionalCosts;

  const maxTotal = priceMode === 'range' && maxPrice !== null && maxPrice !== undefined
    ? maxPrice + totalAdditionalCosts
    : (price || 0) + totalAdditionalCosts;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent className="w-auto min-w-60" align="center">
        {/* Content */}
        <div className="space-y-3">
          <div className="text-xs font-bold text-purple-600 uppercase tracking-wider border-b-2 border-purple-100 pb-2">
            Price Breakdown
          </div>

          {/* Base Price */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-600 font-medium">Base Price:</span>
              <span className="font-bold text-slate-800">
                {priceMode === 'range' && minPrice !== null && maxPrice !== null && minPrice !== undefined && maxPrice !== undefined
                  ? `${currency}${minPrice.toFixed(2)} - ${currency}${maxPrice.toFixed(2)}`
                  : `${currency}${(price || 0).toFixed(2)}`}
              </span>
            </div>

            {/* Visual Range Indicator for Price Ranges */}
            {priceMode === 'range' && minPrice !== null && maxPrice !== null && minPrice !== undefined && maxPrice !== undefined && (
              <div className="py-2">
                <div className="relative h-6 bg-slate-100 rounded-lg overflow-hidden">
                  {/* Max price background (full width) */}
                  <div className="absolute inset-0 bg-linear-to-r from-purple-200 to-purple-300" />
                  
                  {/* Min price indicator */}
                  <div 
                    className="absolute inset-y-0 left-0 bg-linear-to-r from-green-300 to-green-400 flex items-center justify-end pr-2"
                    style={{ width: `${(minPrice / maxPrice) * 100}%` }}
                  >
                    <span className="text-xs font-bold text-green-800">Min</span>
                  </div>
                  
                  {/* Max price label */}
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
            {costs.map((cost, index) => (
              <div key={index} className="flex justify-between items-center text-sm">
                <span className="text-slate-500">{cost.name}:</span>
                <span className="text-slate-700 font-medium">
                  +{currency}{cost.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>

          {/* Total */}
          <div className="flex justify-between items-center text-sm font-bold border-t-2 border-purple-100 pt-2">
            <span className="text-slate-700">Total:</span>
            <span className="text-purple-600 text-base">
              {priceMode === 'range'
                ? `${currency}${minTotal.toFixed(2)} - ${currency}${maxTotal.toFixed(2)}`
                : `${currency}${minTotal.toFixed(2)}`}
            </span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
