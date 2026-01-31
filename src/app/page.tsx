import { db } from '@/lib/db';
import { wishlists, items } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { AddWishlistDialog } from '@/components/add-wishlist-dialog';
import { AddItemDialog } from '@/components/add-item-dialog';
import { UpdateBudgetDialog } from '@/components/update-budget-dialog';
import { HistoryDialog } from '@/components/history-dialog';
import { SettingsDialog } from '@/components/settings-dialog';
import { Plus, History, Home as HomeIcon, Settings } from 'lucide-react';
import Link from 'next/link';
import { generateSlug } from '@/lib/slug';
import { getCurrency, getApiEnabled, getSimulationPriceMode } from '@/lib/settings';
import { getApiSecret } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

async function getWishlists() {
  const allWishlists = await db.select().from(wishlists);
  
  const wishlistsWithItems = await Promise.all(
    allWishlists.map(async (wishlist) => {
      const wishlistItems = await db
        .select()
        .from(items)
        .where(eq(items.wishlistId, wishlist.id));
      
      return {
        ...wishlist,
        items: wishlistItems,
      };
    })
  );
  
  return wishlistsWithItems;
}

async function calculateTotalBudget() {
  const allWishlists = await db.select().from(wishlists);
  return allWishlists.reduce((sum, w) => sum + w.budgetLimit, 0);
}

export default async function Home() {
  const wishlistsData = await getWishlists();
  const totalBudget = await calculateTotalBudget();
  const currency = await getCurrency();
  const apiEnabled = await getApiEnabled();
  const apiSecret = getApiSecret() || null;
  const simulationPriceMode = await getSimulationPriceMode();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header Navigation */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-3">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 text-slate-600 hover:text-purple-400 transition-colors">
              <HomeIcon className="h-5 w-5" />
              <span className="text-sm font-medium">Home</span>
            </Link>
            <div className="flex items-center gap-2">
              <AddWishlistDialog>
                <button className="px-3 py-1.5 text-sm bg-purple-400 text-white rounded-lg hover:bg-purple-500 transition-colors flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Wishlist
                </button>
              </AddWishlistDialog>
              <AddItemDialog wishlists={wishlistsData}>
                <button className="px-3 py-1.5 text-sm bg-white border border-purple-400 text-purple-400 rounded-lg hover:bg-purple-50 transition-colors flex items-center gap-1">
                  <Plus className="h-4 w-4" />
                  Item
                </button>
              </AddItemDialog>
              <UpdateBudgetDialog wishlists={wishlistsData} currency={currency}>
                <button className="px-3 py-1.5 text-sm bg-white border border-slate-300 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors">
                  Budget
                </button>
              </UpdateBudgetDialog>
              <HistoryDialog currency={currency}>
                <button className="p-2 text-slate-600 hover:text-purple-400 transition-colors">
                  <History className="h-5 w-5" />
                </button>
              </HistoryDialog>
              <SettingsDialog currentCurrency={currency} apiEnabled={apiEnabled} apiSecret={apiSecret} simulationPriceMode={simulationPriceMode}>
                <button className="p-2 text-slate-600 hover:text-purple-400 transition-colors">
                  <Settings className="h-5 w-5" />
                </button>
              </SettingsDialog>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-6 py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">
          {/* Left Side - Greeting */}
          <div className="flex-1 min-w-0">
            <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold text-transparent bg-clip-text bg-linear-to-r from-purple-400 to-indigo-400 wrap-break-word">
              Hello!
            </h1>
            <p className="mt-4 text-xl text-slate-600 wrap-break-word">
              Track your wishlists and watch your savings grow
            </p>
          </div>
          
          {/* Right Side - Total Budget */}
          <div className="flex-1 flex justify-center md:justify-end">
            <div className="bg-white rounded-3xl shadow-xl p-8 md:p-12 border-2 border-purple-200">
              <p className="text-sm font-medium text-slate-500 mb-2 uppercase tracking-wide">
                Total Combined Budget
              </p>
              <p className="text-6xl md:text-7xl font-bold text-purple-400">
                {currency}{totalBudget.toFixed(2)}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Wishlist Cards Grid */}
      <section className="container mx-auto px-6 pb-12">
        {wishlistsData.length === 0 ? (
          <div className="text-center py-16">
            <div className="inline-block bg-white rounded-2xl p-12 shadow-lg border border-slate-200">
              <h3 className="text-2xl font-bold text-slate-700 mb-2">No wishlists yet</h3>
              <p className="text-slate-500 mb-6">Create your first wishlist to get started!</p>
              <AddWishlistDialog>
                <button className="px-6 py-3 bg-purple-400 text-white rounded-lg hover:bg-purple-500 transition-colors font-medium">
                  <Plus className="h-5 w-5 inline mr-2" />
                  Create Wishlist
                </button>
              </AddWishlistDialog>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {wishlistsData.map((wishlist) => (
              <Link 
                key={wishlist.id} 
                href={`/wishlist/${generateSlug(wishlist.name, wishlist.id)}`}
                className="group"
              >
                <div className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border-2 border-transparent hover:border-purple-400 cursor-pointer">
                  <div className="p-6 flex gap-4">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-purple-400 transition-colors">
                        {wishlist.name}
                      </h3>
                      {wishlist.description && (
                        <p className="text-slate-500 mb-4 line-clamp-2">
                          {wishlist.description}
                        </p>
                      )}
                      
                      <div className="mt-6 pt-6 border-t border-slate-200">
                        <p className="text-sm font-medium text-slate-500 mb-1">Budget</p>
                        <p className="text-4xl font-bold text-green-400">
                          {currency}{wishlist.budgetLimit.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    
                    {/* Item Icons Preview on Right */}
                    {wishlist.items.filter(item => item.imageUrl).length > 0 && (
                      <div className="flex flex-col gap-1 justify-center">
                        {wishlist.items
                          .filter(item => item.imageUrl)
                          .slice(0, 4)
                          .map((item) => (
                            <div 
                              key={item.id} 
                              className="w-10 h-10 rounded-lg overflow-hidden border-2 border-slate-200 bg-white shrink-0"
                              title={item.name}
                            >
                              <img 
                                src={item.imageUrl!} 
                                alt={item.name} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
