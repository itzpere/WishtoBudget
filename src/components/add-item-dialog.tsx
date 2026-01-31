'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { addItem } from '@/app/actions';
import { Upload, Plus, X } from 'lucide-react';

type Wishlist = {
  id: number;
  name: string;
  description: string | null;
  budgetLimit: number;
};

type AddItemDialogProps = {
  children: React.ReactNode;
  wishlists: Wishlist[];
  defaultWishlistId?: number;
};

type AdditionalCost = {
  name: string;
  amount: string;
};

export function AddItemDialog({ children, wishlists, defaultWishlistId }: AddItemDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedWishlistId, setSelectedWishlistId] = useState('');
  const [priceMode, setPriceMode] = useState<'fixed' | 'range'>('fixed');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  const [showAdditionalCosts, setShowAdditionalCosts] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Set default wishlist when dialog opens
  useEffect(() => {
    if (open && defaultWishlistId && !selectedWishlistId) {
      setSelectedWishlistId(defaultWishlistId.toString());
    }
    if (!open) {
      // Reset form when dialog closes
      setPriceMode('fixed');
      setAdditionalCosts([]);
      setShowAdditionalCosts(false);
    }
  }, [open, defaultWishlistId, selectedWishlistId]);

  // Update preview when image URL changes
  useEffect(() => {
    if (imageUrl) {
      setImagePreview(imageUrl);
    } else if (!uploadedFile) {
      setImagePreview('');
    }
  }, [imageUrl, uploadedFile]);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    
    // Add price mode
    formData.append('priceMode', priceMode);
    
    // Add additional costs as JSON
    const validCosts = additionalCosts.filter(c => c.name && c.amount && parseFloat(c.amount) > 0);
    if (validCosts.length > 0) {
      formData.append('additionalCosts', JSON.stringify(
        validCosts.map(c => ({ name: c.name, amount: parseFloat(c.amount) }))
      ));
    }
    
    // Add imageUrl to formData
    if (imageUrl && !uploadedFile) {
      formData.append('imageUrl', imageUrl);
    }
    const newItem = await addItem(formData);
    
    // If there's an uploaded file, upload it now
    if (uploadedFile) {
      const uploadFormData = new FormData();
      uploadFormData.append('file', uploadedFile);
      uploadFormData.append('itemId', newItem.id.toString());
      
      fetch('/api/upload-icon', {
        method: 'POST',
        body: uploadFormData,
      }).catch(err => console.error('Failed to upload icon:', err));
    } else if (imageUrl && imageUrl.startsWith('http')) {
      // If there's a URL, automatically save it locally
      fetch('/api/save-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: newItem.id, imageUrl }),
      }).catch(err => console.error('Failed to save icon:', err));
    }
    
    setLoading(false);
    setOpen(false);
    setSelectedWishlistId('');
    setImageUrl('');
    setImagePreview('');
    setUploadedFile(null);
    setPriceMode('fixed');
    setAdditionalCosts([]);
    setShowAdditionalCosts(false);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      // Store the file for later upload
      setUploadedFile(file);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setImagePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      // Clear the URL since we have a file
      setImageUrl('');
    } catch (error) {
      console.error('Failed to process file:', error);
    } finally {
      setUploadingFile(false);
    }
  }

  function addAdditionalCost() {
    setAdditionalCosts([...additionalCosts, { name: '', amount: '' }]);
  }

  function removeAdditionalCost(index: number) {
    setAdditionalCosts(additionalCosts.filter((_, i) => i !== index));
  }

  function updateAdditionalCost(index: number, field: 'name' | 'amount', value: string) {
    const updated = [...additionalCosts];
    updated[index][field] = value;
    setAdditionalCosts(updated);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">Add New Item</DialogTitle>
          <DialogDescription className="text-slate-500">
            Add an item to one of your wishlists.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Image Preview at Top */}
          {imagePreview && (
            <div className="flex justify-center pb-2">
              <div className="relative w-40 h-40 bg-slate-50 rounded-2xl overflow-hidden border-2 border-purple-200 shadow-sm">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                  onError={() => setImagePreview('')}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="wishlistId" className="text-slate-700 font-medium">Wishlist</Label>
            <select
              id="wishlistId"
              name="wishlistId"
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
              value={selectedWishlistId}
              onChange={(e) => setSelectedWishlistId(e.target.value)}
              required
            >
              <option value="">Select a wishlist</option>
              {wishlists.map((wishlist) => (
                <option key={wishlist.id} value={wishlist.id}>
                  {wishlist.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemName" className="text-slate-700 font-medium">Item Name</Label>
            <Input
              id="itemName"
              name="name"
              placeholder="e.g., Mechanical Keyboard"
              className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
              required
            />
          </div>

          {/* Price Mode Toggle */}
          <div className="space-y-2">
            <Label className="text-slate-700 font-medium">Price Type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPriceMode('fixed')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all font-medium ${
                  priceMode === 'fixed'
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200'
                }`}
              >
                Fixed Price
              </button>
              <button
                type="button"
                onClick={() => setPriceMode('range')}
                className={`flex-1 py-2 px-4 rounded-lg border-2 transition-all font-medium ${
                  priceMode === 'range'
                    ? 'border-purple-400 bg-purple-50 text-purple-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-purple-200'
                }`}
              >
                Price Range
              </button>
            </div>
          </div>

          {/* Price Inputs */}
          {priceMode === 'fixed' ? (
            <div className="space-y-2">
              <Label htmlFor="price" className="text-slate-700 font-medium">Price</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                placeholder="0.00"
                className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minPrice" className="text-slate-700 font-medium">Min Price</Label>
                <Input
                  id="minPrice"
                  name="minPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxPrice" className="text-slate-700 font-medium">Max Price</Label>
                <Input
                  id="maxPrice"
                  name="maxPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
                  required
                />
              </div>
            </div>
          )}

          {/* Additional Costs Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-slate-700 font-medium">Additional Costs (optional)</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowAdditionalCosts(!showAdditionalCosts);
                  if (!showAdditionalCosts && additionalCosts.length === 0) {
                    addAdditionalCost();
                  }
                }}
                className="text-xs"
              >
                {showAdditionalCosts ? 'Hide' : 'Add'}
              </Button>
            </div>
            
            {showAdditionalCosts && (
              <div className="space-y-2 bg-slate-50 rounded-lg p-4 border border-slate-200">
                {additionalCosts.map((cost, index) => (
                  <div key={index} className="flex gap-2">
                    <Input
                      placeholder="Name (e.g., Tax)"
                      value={cost.name}
                      onChange={(e) => updateAdditionalCost(index, 'name', e.target.value)}
                      className="flex-1 border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
                    />
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      placeholder="0.00"
                      value={cost.amount}
                      onChange={(e) => updateAdditionalCost(index, 'amount', e.target.value)}
                      className="w-24 border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => removeAdditionalCost(index)}
                      className="px-2"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addAdditionalCost}
                  className="w-full text-xs"
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add Another Cost
                </Button>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="itemDescription" className="text-slate-700 font-medium">Description (optional)</Label>
            <Input
              id="itemDescription"
              name="description"
              placeholder="Brief description of the item"
              className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority" className="text-slate-700 font-medium">Priority</Label>
              <select
                id="priority"
                name="priority"
                defaultValue="3"
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-purple-400"
                required
              >
                <option value="5">⭐⭐⭐⭐⭐ Very High</option>
                <option value="4">⭐⭐⭐⭐ High</option>
                <option value="3">⭐⭐⭐ Medium</option>
                <option value="2">⭐⭐ Low</option>
                <option value="1">⭐ Very Low</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="link" className="text-slate-700 font-medium">Link (optional)</Label>
              <Input
                id="link"
                name="link"
                type="url"
                placeholder="https://example.com/product"
                className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="imageUrl" className="text-slate-700 font-medium">Image (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="imageUrl"
                type="url"
                placeholder="https://example.com/image.jpg"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploadingFile}
                variant="outline"
                className="px-4 border-slate-300 hover:bg-slate-50"
              >
                {uploadingFile ? (
                  'Loading...'
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-slate-500">
              Paste a URL or upload an image file. Images will be automatically saved locally.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button type="button" variant="outline" onClick={() => setOpen(false)} className="px-6 border-slate-300 hover:bg-slate-50">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="px-6 bg-purple-400 hover:bg-purple-500 text-white">
              {loading ? 'Adding...' : 'Add Item'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
