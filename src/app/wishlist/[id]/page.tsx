import { db } from '@/lib/db';
import { wishlists, items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Home as HomeIcon, Plus, History, Settings, Trash2 } from 'lucide-react';
import { BatteryItemCard } from '@/components/battery-item-card';
import { AddItemDialog } from '@/components/add-item-dialog';
import { UpdateBudgetDialog } from '@/components/update-budget-dialog';
import { HistoryDialog } from '@/components/history-dialog';
import { SettingsDialog } from '@/components/settings-dialog';
import { DeleteWishlistDialog } from '@/components/delete-wishlist-dialog';
import { WishlistClientWrapper } from '@/components/wishlist-client-wrapper';
import { extractIdFromSlug } from '@/lib/slug';
import { getCurrency, getApiEnabled, getSimulationPriceMode } from '@/lib/settings';
import { getApiSecret } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function getWishlist(id: number) {
  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, id));

  if (!wishlist) {
    return null;
  }

  const wishlistItems = await db
    .select()
    .from(items)
    .where(eq(items.wishlistId, id));

  const totalSpent = wishlistItems
    .filter(item => item.status === 'purchased')
    .reduce((sum, item) => sum + item.price, 0);
  
  const currentlySaved = wishlist.budgetLimit - totalSpent;

  return {
    ...wishlist,
    items: wishlistItems,
    currentlySaved,
  };
}

export default async function WishlistPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const wishlistId = extractIdFromSlug(id);
  
  if (!wishlistId) {
    notFound();
  }
  
  const wishlist = await getWishlist(wishlistId);
  const currency = await getCurrency();
  const apiEnabled = await getApiEnabled();
  const apiSecret = getApiSecret() || null;
  const simulationPriceMode = await getSimulationPriceMode();

  if (!wishlist) {
    notFound();
  }

  // For the AddItemDialog, we need the wishlist in the expected format
  const wishlistForDialog = {
    id: wishlist.id,
    name: wishlist.name,
    description: wishlist.description,
    budgetLimit: wishlist.budgetLimit,
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-purple-400 transition-colors">
              <HomeIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            </div>
            <div className="flex items-center gap-2">
              <AddItemDialog wishlists={[wishlistForDialog]} defaultWishlistId={wishlist.id}>
                <button className="px-3 py-1.5 text-sm bg-purple-400 text-white rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Add Item
                </button>
              </AddItemDialog>
              <UpdateBudgetDialog wishlists={[wishlistForDialog]} defaultWishlistId={wishlist.id} currency={currency}>
                <button className="px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                  Update Budget
                </button>
              </UpdateBudgetDialog>
              <HistoryDialog wishlistId={wishlist.id} currency={currency}>
                <button className="p-2 text-slate-600 hover:text-purple-400 transition-colors">
                  <History className="h-5 w-5" />
                </button>
              </HistoryDialog>
              <SettingsDialog currentCurrency={currency} apiEnabled={apiEnabled} apiSecret={apiSecret} simulationPriceMode={simulationPriceMode}>
                <button className="p-2 text-slate-600 hover:text-purple-400 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
              </SettingsDialog>
              <DeleteWishlistDialog wishlist={{ id: wishlist.id, name: wishlist.name }}>
                <button className="p-2 text-red-500 hover:text-red-600 transition-colors">
                  <Trash2 className="h-5 w-5" />
                </button>
              </DeleteWishlistDialog>
            </div>
          </div>
        </div>
      </header>

      {wishlist.items.length === 0 ? (
        <>
          {/* Hero Section */}
          <section className="container mx-auto px-6 py-12">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8 md:gap-12">
              {/* Left Side - Wishlist Info */}
              <div className="flex-1">
                <h1 className="text-7xl md:text-8xl lg:text-9xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-indigo-400 mb-4">
                  {wishlist.name}
                </h1>
                {wishlist.description && (
                  <p className="text-xl text-slate-600 leading-relaxed">
                    {wishlist.description}
                  </p>
                )}
              </div>
              
              {/* Right Side - Total Budget */}
              <div className="flex-1 flex justify-center md:justify-end">
                <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-purple-200">
                  <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">
                    Total Budget
                  </p>
                  <p className="text-6xl md:text-7xl font-bold text-green-300">
                    {currency}{wishlist.budgetLimit.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Items Grid */}
          <section className="container mx-auto px-6 pb-12">
            <div className="text-center py-16">
              <div className="inline-block bg-white rounded-2xl p-12 shadow-lg border border-slate-200">
                <h3 className="text-2xl font-bold text-slate-700 mb-2">No items yet</h3>
                <p className="text-slate-500 mb-6">Add your first item to this wishlist!</p>
              </div>
            </div>
          </section>
        </>
      ) : (
        <WishlistClientWrapper
          items={wishlist.items}
          wishlistSavings={wishlist.budgetLimit}
          currency={currency}
          wishlistName={wishlist.name}
          wishlistDescription={wishlist.description}
          simulationPriceMode={simulationPriceMode}
        />
      )}
    </div>
  );
}
