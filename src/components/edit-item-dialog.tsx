'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { updateItem } from '@/app/actions';
import { Download, Check, Upload, Plus, X } from 'lucide-react';

type AdditionalCost = {
  name: string;
  amount: string;
};

type EditItemDialogProps = {
  item: {
    id: number;
    name: string;
    description?: string | null;
    price: number;
    priceMode?: 'fixed' | 'range';
    minPrice?: number | null;
    maxPrice?: number | null;
    additionalCosts?: string | null;
    priority: number;
    link?: string | null;
    imageUrl?: string | null;
    localIconPath?: string | null;
  };
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function EditItemDialog({ item, open, onOpenChange }: EditItemDialogProps) {
  const [loading, setLoading] = useState(false);
  const [priceMode, setPriceMode] = useState<'fixed' | 'range'>(item.priceMode || 'fixed');
  const [imageUrl, setImageUrl] = useState(item.imageUrl || '');
  const [imagePreview, setImagePreview] = useState(item.imageUrl || '');
  const [savingIcon, setSavingIcon] = useState(false);
  const [iconSaved, setIconSaved] = useState(!!item.localIconPath);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [additionalCosts, setAdditionalCosts] = useState<AdditionalCost[]>([]);
  const [showAdditionalCosts, setShowAdditionalCosts] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Update preview when image URL changes
  useEffect(() => {
    if (imageUrl) {
      setImagePreview(imageUrl);
      if (imageUrl !== item.imageUrl) {
        setIconSaved(false);
      }
    } else {
      setImagePreview('');
      setIconSaved(false);
    }
  }, [imageUrl, item.imageUrl]);

  // Reset form when item changes or dialog opens
  useEffect(() => {
    if (open) {
      setPriceMode(item.priceMode || 'fixed');
      setImageUrl(item.imageUrl || '');
      setImagePreview(item.imageUrl || '');
      setIconSaved(!!item.localIconPath);
      
      // Parse and set additional costs
      if (item.additionalCosts) {
        try {
          const costs = JSON.parse(item.additionalCosts);
          setAdditionalCosts(costs.map((c: { name: string; amount: number }) => ({ 
            name: c.name, 
            amount: c.amount.toString() 
          })));
          setShowAdditionalCosts(costs.length > 0);
        } catch (e) {
          setAdditionalCosts([]);
          setShowAdditionalCosts(false);
        }
      } else {
        setAdditionalCosts([]);
        setShowAdditionalCosts(false);
      }
    }
  }, [item, open]);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    try {
      const uploadFormData = new FormData();
      uploadFormData.append('file', file);
      uploadFormData.append('itemId', item.id.toString());

      const response = await fetch('/api/upload-icon', {
        method: 'POST',
        body: uploadFormData,
      });

      if (response.ok) {
        const data = await response.json();
        setImageUrl(data.localIconPath);
        setImagePreview(data.localIconPath);
        setIconSaved(true);
      }
    } catch (error) {
      console.error('Failed to upload file:', error);
    } finally {
      setUploadingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }

  async function handleSaveIcon() {
    if (!imageUrl) return;
    
    setSavingIcon(true);
    try {
      const response = await fetch('/api/save-icon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemId: item.id, imageUrl }),
      });

      if (response.ok) {
        setIconSaved(true);
      }
    } catch (error) {
      console.error('Failed to save icon:', error);
    } finally {
      setSavingIcon(false);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    
    const formData = new FormData(e.currentTarget);
    formData.append('itemId', item.id.toString());
    formData.append('priceMode', priceMode);
    
    // Add additional costs as JSON
    const validCosts = additionalCosts.filter(c => c.name && c.amount && parseFloat(c.amount) > 0);
    if (validCosts.length > 0) {
      formData.append('additionalCosts', JSON.stringify(
        validCosts.map(c => ({ name: c.name, amount: parseFloat(c.amount) }))
      ));
    }
    
    if (imageUrl) {
      formData.append('imageUrl', imageUrl);
    }
    
    await updateItem(formData);
    
    setLoading(false);
    onOpenChange(false);
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
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-slate-800">Edit Item</DialogTitle>
          <DialogDescription className="text-slate-500">
            Update the details of this item in your wishlist.
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
            <Label htmlFor="editItemName" className="text-slate-700 font-medium">Item Name</Label>
            <Input
              id="editItemName"
              name="name"
              defaultValue={item.name}
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
              <Label htmlFor="editPrice" className="text-slate-700 font-medium">Price</Label>
              <Input
                id="editPrice"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={item.price}
                placeholder="0.00"
                className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
                required
              />
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editMinPrice" className="text-slate-700 font-medium">Min Price</Label>
                <Input
                  id="editMinPrice"
                  name="minPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item.minPrice || item.price}
                  placeholder="0.00"
                  className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editMaxPrice" className="text-slate-700 font-medium">Max Price</Label>
                <Input
                  id="editMaxPrice"
                  name="maxPrice"
                  type="number"
                  step="0.01"
                  min="0"
                  defaultValue={item.maxPrice || item.price}
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
            <Label htmlFor="editItemDescription" className="text-slate-700 font-medium">Description (optional)</Label>
            <Input
              id="editItemDescription"
              name="description"
              defaultValue={item.description || ''}
              placeholder="Brief description of the item"
              className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-priority" className="text-slate-700 font-medium">Priority</Label>
              <select
                id="edit-priority"
                name="priority"
                defaultValue={item.priority}
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
              <Label htmlFor="editLink" className="text-slate-700 font-medium">Link (optional)</Label>
              <Input
                id="editLink"
                name="link"
                type="url"
                defaultValue={item.link || ''}
                placeholder="https://example.com/product"
                className="border-slate-300 focus:border-purple-400 focus:ring-purple-400 placeholder:text-gray-500"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="editImageUrl" className="text-slate-700 font-medium">Image (optional)</Label>
            <div className="flex gap-2">
              <Input
                id="editImageUrl"
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
                  'Uploading...'
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Upload
                  </>
                )}
              </Button>
              {imageUrl && (
                <Button
                  type="button"
                  onClick={handleSaveIcon}
                  disabled={savingIcon || iconSaved || !imageUrl}
                  variant="outline"
                  className="px-4 border-slate-300 hover:bg-slate-50"
                >
                  {iconSaved ? (
                    <>
                      <Check className="h-4 w-4 mr-2 text-green-500" />
                      Saved
                    </>
                  ) : savingIcon ? (
                    'Saving...'
                  ) : (
                    <>
                      <Download className="h-4 w-4 mr-2" />
                      Save Icon
                    </>
                  )}
                </Button>
              )}
            </div>
            <p className="text-xs text-slate-500">
              Paste a URL or upload an image file. Click &quot;Save Icon&quot; to download and store remote images locally.
            </p>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              className="px-6 border-slate-300 hover:bg-slate-50"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={loading}
              className="px-6 bg-purple-400 hover:bg-purple-500 text-white"
            >
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}