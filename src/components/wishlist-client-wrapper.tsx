'use client';

import { useState, useEffect } from 'react';
import { WishlistItemsSection } from '@/components/wishlist-items-section';
import { BudgetDisplay } from '@/components/budget-display';

type Item = {
  id: number;
  name: string;
  description: string | null;
  price: number;
  priceMode?: 'fixed' | 'range';
  minPrice?: number | null;
  maxPrice?: number | null;
  additionalCosts?: string | null;
  priority: number;
  status: 'pending' | 'purchased';
  imageUrl: string | null;
  localIconPath?: string | null;
  link: string | null;
  wishlistId: number;
  createdAt: Date;
};

type WishlistClientWrapperProps = {
  items: Item[];
  wishlistSavings: number;
  currency: string;
  wishlistName: string;
  wishlistDescription: string | null;
  simulationPriceMode?: 'min' | 'max' | 'average';
};

export function WishlistClientWrapper({ 
  items, 
  wishlistSavings, 
  currency,
  wishlistName,
  wishlistDescription,
  simulationPriceMode = 'max'
}: WishlistClientWrapperProps) {
  const [simulationData, setSimulationData] = useState<{
    isActive: boolean;
    remainingBudget: number;
    isOverBudget: boolean;
  }>({
    isActive: false,
    remainingBudget: wishlistSavings,
    isOverBudget: false,
  });

  return (
    <>
      {/* Hero Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 md:gap-12">
          {/* Left Side - Wishlist Info */}
          <div className="flex-1">
            <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-indigo-400 mb-4">
              {wishlistName}
            </h1>
            {wishlistDescription && (
              <p className="text-xl text-slate-600 leading-relaxed">
                {wishlistDescription}
              </p>
            )}
          </div>
          
          {/* Right Side - Budget Display */}
          <div className="flex-1 flex justify-center md:justify-end">
            <BudgetDisplay
              label={simulationData.isActive ? 'Simulated Budget' : 'Total Budget'}
              amount={simulationData.isActive ? simulationData.remainingBudget : wishlistSavings}
              currency={currency}
              isSimulation={simulationData.isActive}
              isOverBudget={simulationData.isOverBudget}
            />
          </div>
        </div>
      </section>

      {/* Items Section */}
      <section className="container mx-auto px-6 pb-12">
        <WishlistItemsSection 
          items={items}
          wishlistSavings={wishlistSavings}
          currency={currency}
          simulationPriceMode={simulationPriceMode}
          BudgetDisplayComponent={BudgetDisplay}
          onSimulationChange={setSimulationData}
        />
      </section>
    </>
  );
}
