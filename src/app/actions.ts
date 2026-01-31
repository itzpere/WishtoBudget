'use server';

import { db } from '@/lib/db';
import { wishlists, items, history, settings } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { setSetting, setApiEnabled, setSimulationPriceMode } from '@/lib/settings';
import fs from 'fs';
import path from 'path';

export async function addWishlist(formData: FormData) {
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;
  const budgetLimit = parseFloat(formData.get('budgetLimit') as string);

  const [newWishlist] = await db
    .insert(wishlists)
    .values({
      name,
      description: description || null,
      budgetLimit,
    })
    .returning();

  await db.insert(history).values({
    type: 'budget_change',
    amount: budgetLimit,
    description: `Created wishlist "${name}" with budget $${budgetLimit.toFixed(2)}`,
  });

  revalidatePath('/');
  return newWishlist;
}

export async function addItem(formData: FormData) {
  const wishlistId = parseInt(formData.get('wishlistId') as string);
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;
  const priceMode = (formData.get('priceMode') as 'fixed' | 'range') || 'fixed';
  const priority = parseInt(formData.get('priority') as string);
  const link = formData.get('link') as string | null;
  const imageUrl = formData.get('imageUrl') as string | null;
  const additionalCosts = formData.get('additionalCosts') as string | null;

  // Parse price based on mode
  let price = 0;
  let minPrice = null;
  let maxPrice = null;

  if (priceMode === 'fixed') {
    price = parseFloat(formData.get('price') as string);
  } else {
    minPrice = parseFloat(formData.get('minPrice') as string);
    maxPrice = parseFloat(formData.get('maxPrice') as string);
    // For backwards compatibility, set price to max price
    price = maxPrice;
  }

  // Calculate total with additional costs for history
  let totalCost = price;
  if (additionalCosts) {
    try {
      const costs = JSON.parse(additionalCosts);
      totalCost += costs.reduce((sum: number, cost: { amount: number }) => sum + cost.amount, 0);
    } catch (e) {
      // If JSON parsing fails, ignore additional costs
    }
  }

  const [newItem] = await db
    .insert(items)
    .values({
      wishlistId,
      name,
      description: description || null,
      price,
      priceMode,
      minPrice,
      maxPrice,
      additionalCosts,
      priority,
      status: 'pending',
      link: link || null,
      imageUrl: imageUrl || null,
    })
    .returning();

  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, wishlistId));

  // Create detailed description for history
  let priceDescription = '';
  if (priceMode === 'fixed') {
    priceDescription = `$${price.toFixed(2)}`;
  } else {
    priceDescription = `$${minPrice?.toFixed(2)} - $${maxPrice?.toFixed(2)}`;
  }
  if (additionalCosts) {
    priceDescription += ` (total: $${totalCost.toFixed(2)})`;
  }

  const historyMetadata = {
    itemId: newItem.id,
    itemName: name,
    priceMode,
    basePrice: price,
    minPrice,
    maxPrice,
    additionalCosts: additionalCosts ? JSON.parse(additionalCosts) : [],
    totalCost,
  };

  await db.insert(history).values({
    type: 'item_add',
    amount: totalCost,
    description: `Added item "${name}" (${priceDescription}) to wishlist "${wishlist.name}"`,
    metadata: JSON.stringify(historyMetadata),
  });

  revalidatePath('/');
  revalidatePath(`/wishlist/${wishlistId}`);
  return newItem;
}

export async function updateBudget(formData: FormData) {
  const wishlistId = parseInt(formData.get('wishlistId') as string);
  const amount = parseFloat(formData.get('amount') as string);
  const operation = formData.get('operation') as 'add' | 'remove' | 'overwrite';

  const [oldWishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, wishlistId));

  let newBudget: number;
  let description: string;

  switch (operation) {
    case 'add':
      newBudget = oldWishlist.budgetLimit + amount;
      description = `Added $${amount.toFixed(2)} to "${oldWishlist.name}" budget (from $${oldWishlist.budgetLimit.toFixed(2)} to $${newBudget.toFixed(2)})`;
      break;
    case 'remove':
      newBudget = Math.max(0, oldWishlist.budgetLimit - amount);
      description = `Removed $${amount.toFixed(2)} from "${oldWishlist.name}" budget (from $${oldWishlist.budgetLimit.toFixed(2)} to $${newBudget.toFixed(2)})`;
      break;
    case 'overwrite':
      newBudget = amount;
      description = `Overwrite budget for "${oldWishlist.name}" from $${oldWishlist.budgetLimit.toFixed(2)} to $${newBudget.toFixed(2)}`;
      break;
    default:
      throw new Error('Invalid operation');
  }

  const [updated] = await db
    .update(wishlists)
    .set({ budgetLimit: newBudget })
    .where(eq(wishlists.id, wishlistId))
    .returning();

  const difference = newBudget - oldWishlist.budgetLimit;
  await db.insert(history).values({
    type: 'budget_change',
    amount: difference,
    description,
  });

  revalidatePath('/');
  revalidatePath(`/wishlist/${wishlistId}`);
  return updated;
}

export async function purchaseItem(itemId: number, deductFromBudget: boolean = false, customAmount?: number) {
  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId));

  if (item.status === 'purchased') {
    return item;
  }

  // Calculate the amount to deduct
  let amountToDeduct = customAmount !== undefined ? customAmount : item.price;
  
  // Add additional costs to the amount
  if (item.additionalCosts) {
    try {
      const costs = JSON.parse(item.additionalCosts);
      const additionalTotal = costs.reduce((sum: number, cost: { amount: number }) => sum + cost.amount, 0);
      if (customAmount === undefined) {
        amountToDeduct += additionalTotal;
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }

  const [updated] = await db
    .update(items)
    .set({ 
      status: 'purchased',
      purchasedAmount: amountToDeduct,
    })
    .where(eq(items.id, itemId))
    .returning();

  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, item.wishlistId));

  // Create detailed metadata
  const historyMetadata = {
    itemId,
    itemName: item.name,
    priceMode: item.priceMode,
    basePrice: item.price,
    minPrice: item.minPrice,
    maxPrice: item.maxPrice,
    additionalCosts: item.additionalCosts ? JSON.parse(item.additionalCosts) : [],
    purchasedAmount: amountToDeduct,
    deductedFromBudget: deductFromBudget,
  };

  // If user chooses to deduct from budget, update the budget
  if (deductFromBudget) {
    const newBudget = wishlist.budgetLimit - amountToDeduct;
    await db
      .update(wishlists)
      .set({ budgetLimit: newBudget })
      .where(eq(wishlists.id, item.wishlistId));

    await db.insert(history).values({
      type: 'purchase',
      amount: amountToDeduct,
      description: `Purchased "${item.name}" ($${amountToDeduct.toFixed(2)}) from wishlist "${wishlist.name}" and deducted from budget`,
      metadata: JSON.stringify(historyMetadata),
    });
  } else {
    await db.insert(history).values({
      type: 'purchase',
      amount: amountToDeduct,
      description: `Purchased "${item.name}" ($${amountToDeduct.toFixed(2)}) from wishlist "${wishlist.name}"`,
      metadata: JSON.stringify(historyMetadata),
    });
  }

  revalidatePath('/');
  revalidatePath(`/wishlist/${item.wishlistId}`);
  return updated;
}

export async function unpurchaseItem(itemId: number, addBackToBudget: boolean = false) {
  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId));

  if (item.status !== 'purchased') {
    return item;
  }

  const [updated] = await db
    .update(items)
    .set({ status: 'pending' })
    .where(eq(items.id, itemId))
    .returning();

  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, item.wishlistId));

  // If user chooses to add back to budget, update the budget
  if (addBackToBudget) {
    // Use the purchasedAmount if available, otherwise use price
    const amountToRefund = item.purchasedAmount || item.price;
    const newBudget = wishlist.budgetLimit + amountToRefund;
    await db
      .update(wishlists)
      .set({ budgetLimit: newBudget })
      .where(eq(wishlists.id, item.wishlistId));

    const historyMetadata = {
      itemId,
      itemName: item.name,
      refundedAmount: amountToRefund,
      addedBackToBudget: true,
    };

    await db.insert(history).values({
      type: 'purchase',
      amount: -amountToRefund,
      description: `Unpurchased "${item.name}" ($${amountToRefund.toFixed(2)}) from wishlist "${wishlist.name}" and added back to budget`,
      metadata: JSON.stringify(historyMetadata),
    });
  } else {
    const amountToRefund = item.purchasedAmount || item.price;
    const historyMetadata = {
      itemId,
      itemName: item.name,
      refundedAmount: amountToRefund,
      addedBackToBudget: false,
    };

    await db.insert(history).values({
      type: 'purchase',
      amount: -amountToRefund,
      description: `Unpurchased "${item.name}" ($${amountToRefund.toFixed(2)}) from wishlist "${wishlist.name}"`,
      metadata: JSON.stringify(historyMetadata),
    });
  }

  revalidatePath('/');
  revalidatePath(`/wishlist/${item.wishlistId}`);
  return updated;
}

export async function updateItem(formData: FormData) {
  const itemId = parseInt(formData.get('itemId') as string);
  const name = formData.get('name') as string;
  const description = formData.get('description') as string | null;
  const priceMode = (formData.get('priceMode') as 'fixed' | 'range') || 'fixed';
  const priority = parseInt(formData.get('priority') as string);
  const link = formData.get('link') as string | null;
  const imageUrl = formData.get('imageUrl') as string | null;
  const additionalCosts = formData.get('additionalCosts') as string | null;

  // Parse price based on mode
  let price = 0;
  let minPrice = null;
  let maxPrice = null;

  if (priceMode === 'fixed') {
    price = parseFloat(formData.get('price') as string);
  } else {
    minPrice = parseFloat(formData.get('minPrice') as string);
    maxPrice = parseFloat(formData.get('maxPrice') as string);
    price = maxPrice;
  }

  // Calculate total with additional costs for history
  let totalCost = price;
  if (additionalCosts) {
    try {
      const costs = JSON.parse(additionalCosts);
      totalCost += costs.reduce((sum: number, cost: { amount: number }) => sum + cost.amount, 0);
    } catch (e) {
      // Ignore parsing errors
    }
  }

  const [oldItem] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId));

  const [updated] = await db
    .update(items)
    .set({
      name,
      description: description || null,
      price,
      priceMode,
      minPrice,
      maxPrice,
      additionalCosts,
      priority,
      link: link || null,
      imageUrl: imageUrl || null,
    })
    .where(eq(items.id, itemId))
    .returning();

  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, oldItem.wishlistId));

  // Create detailed description
  let priceDescription = '';
  if (priceMode === 'fixed') {
    priceDescription = `$${price.toFixed(2)}`;
  } else {
    priceDescription = `$${minPrice?.toFixed(2)} - $${maxPrice?.toFixed(2)}`;
  }
  if (additionalCosts) {
    priceDescription += ` (total: $${totalCost.toFixed(2)})`;
  }

  const historyMetadata = {
    itemId,
    itemName: name,
    priceMode,
    basePrice: price,
    minPrice,
    maxPrice,
    additionalCosts: additionalCosts ? JSON.parse(additionalCosts) : [],
    totalCost,
  };

  await db.insert(history).values({
    type: 'item_update',
    amount: 0,
    description: `Updated item "${oldItem.name}" to "${name}" (${priceDescription}) in wishlist "${wishlist.name}"`,
    metadata: JSON.stringify(historyMetadata),
  });

  revalidatePath('/');
  revalidatePath(`/wishlist/${oldItem.wishlistId}`);
  return updated;
}

export async function deleteItem(itemId: number) {
  const [item] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId));

  // Delete the item from database
  await db.delete(items).where(eq(items.id, itemId));

  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, item.wishlistId));

  await db.insert(history).values({
    type: 'item_delete',
    amount: -item.price,
    description: `Deleted item "${item.name}" ($${item.price.toFixed(2)}) from wishlist "${wishlist.name}"`,
  });

  // Trigger icon cleanup (fire and forget)
  fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/cleanup-icons`, {
    method: 'POST',
  }).catch(err => console.error('Failed to cleanup icons:', err));

  revalidatePath('/');
  revalidatePath(`/wishlist/${item.wishlistId}`);
}

export async function updateSettings(formData: FormData) {
  const currency = formData.get('currency') as string;
  const apiEnabled = formData.get('apiEnabled') === 'true';
  const simulationPriceMode = formData.get('simulationPriceMode') as 'min' | 'max' | 'average';
  
  await setSetting('currency', currency);
  await setApiEnabled(apiEnabled);
  if (simulationPriceMode) {
    await setSimulationPriceMode(simulationPriceMode);
  }
  
  revalidatePath('/');
}

export async function deleteWishlist(wishlistId: number) {
  const [wishlist] = await db
    .select()
    .from(wishlists)
    .where(eq(wishlists.id, wishlistId));

  if (!wishlist) {
    throw new Error('Wishlist not found');
  }

  // Get all items for history logging
  const wishlistItems = await db
    .select()
    .from(items)
    .where(eq(items.wishlistId, wishlistId));

  // Delete the wishlist (cascade will delete items)
  await db.delete(wishlists).where(eq(wishlists.id, wishlistId));

  // Log to history
  await db.insert(history).values({
    type: 'budget_change',
    amount: -wishlist.budgetLimit,
    description: `Deleted wishlist "${wishlist.name}" with ${wishlistItems.length} item(s)`,
  });

  revalidatePath('/');
  redirect('/');
}

export async function exportDatabase() {
  const allWishlists = await db.select().from(wishlists);
  const allItems = await db.select().from(items);
  const allHistory = await db.select().from(history);
  const allSettings = await db.select().from(settings);

  // Collect all local icon paths
  const iconPaths = allItems
    .filter(item => item.localIconPath)
    .map(item => item.localIconPath as string);

  // Read icon files as base64
  const icons: Record<string, string> = {};
  if (iconPaths.length > 0) {
    try {
      for (const iconPath of iconPaths) {
        const fullPath = path.join(process.cwd(), 'public', iconPath);
        if (fs.existsSync(fullPath)) {
          const buffer = fs.readFileSync(fullPath);
          icons[iconPath] = buffer.toString('base64');
        }
      }
    } catch (error) {
      console.error('Error reading icons:', error);
    }
  }

  const exportData = {
    version: '1.1',
    exportDate: new Date().toISOString(),
    wishlists: allWishlists,
    items: allItems,
    history: allHistory,
    settings: allSettings,
    icons,
  };

  return exportData;
}

export async function importDatabase(data: string) {
  try {
    const importData = JSON.parse(data);

    // Validate the data structure
    if (!importData.version || !importData.wishlists || !importData.items) {
      throw new Error('Invalid backup file format');
    }

    // Clear existing data
    await db.delete(items);
    await db.delete(history);
    await db.delete(wishlists);
    await db.delete(settings);

    // Import wishlists - convert createdAt string to Date
    if (importData.wishlists.length > 0) {
      const wishlistsData = importData.wishlists.map((w: typeof importData.wishlists[number]) => ({
        ...w,
        createdAt: w.createdAt ? new Date(w.createdAt) : new Date(),
      }));
      await db.insert(wishlists).values(wishlistsData);
    }

    // Import items - convert createdAt string to Date
    if (importData.items.length > 0) {
      const itemsData = importData.items.map((i: typeof importData.items[number]) => ({
        ...i,
        createdAt: i.createdAt ? new Date(i.createdAt) : new Date(),
      }));
      await db.insert(items).values(itemsData);
    }

    // Import history - convert timestamp string to Date
    if (importData.history && importData.history.length > 0) {
      const historyData = importData.history.map((h: typeof importData.history[number]) => ({
        ...h,
        timestamp: h.timestamp ? new Date(h.timestamp) : new Date(),
      }));
      await db.insert(history).values(historyData);
    }

    // Import settings - convert updatedAt string to Date
    if (importData.settings && importData.settings.length > 0) {
      const settingsData = importData.settings.map((s: typeof importData.settings[number]) => ({
        ...s,
        updatedAt: s.updatedAt ? new Date(s.updatedAt) : new Date(),
      }));
      await db.insert(settings).values(settingsData);
    }

    // Restore icons if they exist in the backup
    if (importData.icons && Object.keys(importData.icons).length > 0) {
      try {
        const iconsDir = path.join(process.cwd(), 'public', 'icons');
        
        // Create icons directory if it doesn't exist
        if (!fs.existsSync(iconsDir)) {
          fs.mkdirSync(iconsDir, { recursive: true });
        }

        // Write each icon file
        for (const [iconPath, base64Data] of Object.entries(importData.icons)) {
          const fullPath = path.join(process.cwd(), 'public', iconPath);
          const buffer = Buffer.from(base64Data as string, 'base64');
          fs.writeFileSync(fullPath, buffer);
        }
      } catch (error) {
        console.error('Error restoring icons:', error);
        // Don't fail the entire import if icons fail
      }
    }

    revalidatePath('/');
    return { success: true };
  } catch (error) {
    console.error('Import error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
