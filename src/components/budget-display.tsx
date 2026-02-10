'use client';

type BudgetDisplayProps = {
  label: string;
  amount: number;
  currency: string;
  isSimulation?: boolean;
  isOverBudget?: boolean;
};

export function BudgetDisplay({ label, amount, currency, isSimulation = false, isOverBudget = false }: BudgetDisplayProps) {
  const isNegative = amount < 0;
  const displayAmount = Math.abs(amount);
  
  return (
    <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-purple-200">
      <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">
        {isNegative ? 'Budget Deficit' : label}
      </p>
      <p className={`text-6xl md:text-7xl font-bold transition-colors ${
        isNegative
          ? 'text-red-500'
          : isOverBudget 
            ? 'text-red-500 animate-pulse' 
            : isSimulation 
              ? 'text-purple-500' 
              : 'text-green-300'
      }`}>
        {isNegative ? '-' : ''}{currency}{displayAmount.toFixed(2)}
      </p>
    </div>
  );
}
