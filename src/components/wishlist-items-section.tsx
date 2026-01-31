'use client';

import { useState, useEffect } from 'react';
import { BatteryItemCard } from '@/components/battery-item-card';
import { ArrowUpDown, Calendar, DollarSign, Star, Calculator, X } from 'lucide-react';

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

type SortOption = 'priority' | 'price-asc' | 'price-desc' | 'date-added';

type WishlistItemsSectionProps = {
  items: Item[];
  wishlistSavings: number;
  currency: string;
  simulationPriceMode?: 'min' | 'max' | 'average';
  BudgetDisplayComponent: React.ComponentType<{
    label: string;
    amount: number;
    currency: string;
    isSimulation?: boolean;
    isOverBudget?: boolean;
  }>;
  onSimulationChange?: (data: { isActive: boolean; remainingBudget: number; isOverBudget: boolean }) => void;
};

export function WishlistItemsSection({ items, wishlistSavings, currency, simulationPriceMode = 'max', BudgetDisplayComponent, onSimulationChange }: WishlistItemsSectionProps) {
  const [sortBy, setSortBy] = useState<SortOption>('priority');
  const [isSimulationMode, setIsSimulationMode] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<Set<number>>(new Set());

  const pendingItems = items.filter(item => item.status === 'pending');
  const purchasedItems = items.filter(item => item.status === 'purchased');

  // Helper function to calculate total cost including additional costs
  const calculateItemCost = (item: Item) => {
    const isRangeMode = item.priceMode === 'range';
    let basePrice = item.price;
    
    // For range mode, use simulation setting to determine which price to use
    if (isRangeMode) {
      const minPrice = item.minPrice || item.price;
      const maxPrice = item.maxPrice || item.price;
      
      switch (simulationPriceMode) {
        case 'min':
          basePrice = minPrice;
          break;
        case 'max':
          basePrice = maxPrice;
          break;
        case 'average':
          basePrice = (minPrice + maxPrice) / 2;
          break;
      }
    }
    
    // Add additional costs
    let totalCost = basePrice;
    if (item.additionalCosts) {
      try {
        const costs = JSON.parse(item.additionalCosts);
        costs.forEach((cost: { name: string; amount: number }) => {
          totalCost += cost.amount;
        });
      } catch (e) {
        // Invalid JSON, use base price only
      }
    }
    
    return totalCost;
  };

  // Calculate simulated remaining budget
  const selectedItemsCost = Array.from(selectedItemIds).reduce((total, itemId) => {
    const item = pendingItems.find(i => i.id === itemId);
    return total + (item ? calculateItemCost(item) : 0);
  }, 0);
  const simulatedRemainingBudget = wishlistSavings - selectedItemsCost;
  const effectiveBudget = isSimulationMode ? simulatedRemainingBudget : wishlistSavings;

  const toggleItemSelection = (itemId: number) => {
    if (!isSimulationMode) return;
    
    const newSelected = new Set(selectedItemIds);
    if (newSelected.has(itemId)) {
      newSelected.delete(itemId);
    } else {
      newSelected.add(itemId);
    }
    setSelectedItemIds(newSelected);
  };

  const toggleSimulationMode = () => {
    if (isSimulationMode) {
      // Exit simulation mode
      setSelectedItemIds(new Set());
      setIsSimulationMode(false);
      onSimulationChange?.({ isActive: false, remainingBudget: wishlistSavings, isOverBudget: false });
    } else {
      // Enter simulation mode
      setIsSimulationMode(true);
      onSimulationChange?.({ isActive: true, remainingBudget: wishlistSavings, isOverBudget: false });
    }
  };

  // Update parent component whenever simulation data changes
  useEffect(() => {
    if (isSimulationMode) {
      onSimulationChange?.({
        isActive: true,
        remainingBudget: simulatedRemainingBudget,
        isOverBudget: simulatedRemainingBudget < 0,
      });
    }
  }, [isSimulationMode, simulatedRemainingBudget, onSimulationChange]);

  // Sort purchased items by date only (most recent first)
  const sortedPurchasedItems = [...purchasedItems].sort((a, b) => 
    new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const sortItems = (itemsToSort: Item[]) => {
    const sorted = [...itemsToSort];
    
    switch (sortBy) {
      case 'priority':
        sorted.sort((a, b) => b.priority - a.priority);
        break;
      case 'price-asc':
        sorted.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        sorted.sort((a, b) => b.price - a.price);
        break;
      case 'date-added':
        sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
    }
    
    return sorted;
  };

  const groupByPriority = (itemsToGroup: Item[]) => {
    const groups: { [key: number]: Item[] } = {};
    itemsToGroup.forEach(item => {
      if (!groups[item.priority]) {
        groups[item.priority] = [];
      }
      groups[item.priority].push(item);
    });
    return groups;
  };

  const sortedPendingItems = sortItems(pendingItems);

  const renderSortButton = (option: SortOption, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => setSortBy(option)}
      className={`px-4 py-2 rounded-xl border-2 transition-all flex items-center gap-2 text-sm font-medium ${
        sortBy === option
          ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-sm'
          : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200 hover:bg-slate-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  const renderWaveDivider = (label: string) => (
    <div className="w-4/5 mx-auto my-8 relative flex items-center justify-center">
      <svg className="w-full h-2" viewBox="0 0 100 10" preserveAspectRatio="none">
        <path
          d="M0,5 Q12.5,0 25,5 T50,5 T75,5 T100,5"
          fill="none"
          stroke="rgb(226 232 240)"
          strokeWidth="2"
          className="animate-[wave_3s_ease-in-out_infinite]"
        />
      </svg>
      <span className="absolute bg-slate-50 px-4 text-slate-500 text-sm font-medium uppercase tracking-wide">
        {label}
      </span>
    </div>
  );

  const renderPriorityLabel = (priority: number) => {
    const labels = ['Very Low', 'Low', 'Medium', 'High', 'Very High'];
    const colors = [
      'text-slate-400 border-slate-200',
      'text-blue-500 border-blue-200',
      'text-yellow-500 border-yellow-200',
      'text-orange-500 border-orange-200',
      'text-red-500 border-red-200'
    ];
    
    return (
      <div className="w-4/5 mx-auto my-12 relative flex items-center justify-center">
        <div className="h-0.5 w-full bg-slate-200"></div>
        <span className={`absolute bg-slate-50 px-4 py-1 text-xs font-bold uppercase tracking-wider border-2 rounded-full ${colors[priority - 1]}`}>
          Priority {priority}: {labels[priority - 1]}
        </span>
      </div>
    );
  };

  return (
    <>
      {/* Sort Options with Simulation Toggle */}
      <div className="mb-8 flex flex-wrap items-center justify-between gap-3 bg-white rounded-2xl p-4 shadow-sm border border-slate-200">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-slate-600">
            <ArrowUpDown className="h-5 w-5" />
            <span className="text-sm font-semibold">Sort by:</span>
          </div>
          {renderSortButton('priority', 'Priority', <Star className="h-4 w-4" />)}
          {renderSortButton('price-asc', 'Price: Low to High', <DollarSign className="h-4 w-4" />)}
          {renderSortButton('price-desc', 'Price: High to Low', <DollarSign className="h-4 w-4" />)}
          {renderSortButton('date-added', 'Date Added', <Calendar className="h-4 w-4" />)}
        </div>
        
        <div className="flex items-center gap-3">
          {isSimulationMode && (
            <div className="text-sm text-slate-600 bg-purple-50 px-4 py-2 rounded-lg border border-purple-200">
              <span className="font-semibold text-purple-700">
                {selectedItemIds.size} selected
              </span>
            </div>
          )}
          
          <button
            onClick={toggleSimulationMode}
            className={`px-5 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 text-sm ${
              isSimulationMode
                ? 'bg-purple-500 text-white hover:bg-purple-600 shadow-lg shadow-purple-200'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200 border-2 border-slate-300'
            }`}
          >
            {isSimulationMode ? (
              <>
                <X className="h-4 w-4" />
                Exit Simulation
              </>
            ) : (
              <>
                <Calculator className="h-4 w-4" />
                Simulate Spending
              </>
            )}
          </button>
        </div>
      </div>

      {renderWaveDivider('Wishes')}

      {/* Pending Items */}
      {sortBy === 'priority' ? (
        // Group by priority
        <>
          {[5, 4, 3, 2, 1].map(priority => {
            const priorityItems = sortedPendingItems.filter(item => item.priority === priority);
            
            return (
              <div key={priority}>
                {renderPriorityLabel(priority)}
                {priorityItems.length > 0 && (
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 mb-6">
                    {priorityItems.map((item) => (
                      <BatteryItemCard
                        key={item.id}
                        item={item}
                        wishlistSavings={effectiveBudget}
                        currency={currency}
                        isSimulationMode={isSimulationMode}
                        isSelected={selectedItemIds.has(item.id)}
                        onToggleSelect={() => toggleItemSelection(item.id)}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </>
      ) : (
        // Regular grid without priority groups
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
          {sortedPendingItems.map((item) => (
            <BatteryItemCard
              key={item.id}
              item={item}
              wishlistSavings={effectiveBudget}
              currency={currency}
              isSimulationMode={isSimulationMode}
              isSelected={selectedItemIds.has(item.id)}
              onToggleSelect={() => toggleItemSelection(item.id)}
            />
          ))}
        </div>
      )}

      {/* Purchased Items Section */}
      {purchasedItems.length > 0 && (
        <>
          {renderWaveDivider('Purchased')}
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {sortedPurchasedItems.map((item) => (
              <BatteryItemCard
                key={item.id}
                item={item}
                wishlistSavings={wishlistSavings}
                currency={currency}
              />
            ))}
          </div>
        </>
      )}
    </>
  );
}
