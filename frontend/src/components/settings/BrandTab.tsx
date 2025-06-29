'use client';

import { useState } from 'react';
import { ApiService } from '@/lib/api';

interface Brand {
  id: number;
  name: string;
  is_active: boolean;
}

interface BrandTabProps {
  brands: Brand[];
  setBrands: (brands: Brand[]) => void;
  showNotification: (type: 'success' | 'error', message: string) => void;
  loading: boolean;
  onDeleteClick: (brand: Brand) => void;
}

export default function BrandTab({ brands, setBrands, showNotification, loading, onDeleteClick }: BrandTabProps) {
  const [newBrand, setNewBrand] = useState('');

  const handleAddBrand = async () => {
    if (!newBrand.trim()) return;
    
    try {
      const response = await ApiService.createBrand({
        name: newBrand.trim(),
        is_active: true
      });
      
      const newBrandItem = response.brand;
      setBrands([...brands, newBrandItem]);
      setNewBrand('');
      showNotification('success', 'Brand added successfully!');
    } catch (error) {
      console.error('Error adding brand:', error);
      showNotification('error', error instanceof Error ? error.message : 'Failed to add brand');
    }
  };

  const toggleBrand = async (id: number) => {
    try {
      await ApiService.toggleBrand(id);
      setBrands(brands.map(brand => 
        brand.id === id ? { ...brand, is_active: !brand.is_active } : brand
      ));
      const updatedBrand = brands.find(b => b.id === id);
      showNotification('success', `Brand ${!updatedBrand?.is_active ? 'activated' : 'deactivated'} successfully!`);
    } catch (error) {
      console.error('Error updating brand:', error);
      showNotification('error', error instanceof Error ? error.message : 'Error updating brand. Please try again.');
    }
  };

  const handleDeleteClick = (brand: Brand) => {
    onDeleteClick(brand);
  };

  return (
    <>
      <div className="space-y-6">
        <div>
          {/* Add Brand */}
          <div className="mb-8">
            <h4 className="text-lg font-medium text-white mb-4">Add New Brand</h4>
            <div className="flex gap-3 max-w-md">
              <input
                type="text"
                value={newBrand}
                onChange={(e) => setNewBrand(e.target.value)}
                className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 focus:border-blue-400 text-white placeholder-gray-400 text-sm backdrop-blur-sm"
                placeholder="Brand name"
                onKeyPress={(e) => e.key === 'Enter' && handleAddBrand()}
              />
              <button
                onClick={handleAddBrand}
                disabled={loading || !newBrand.trim()}
                className="px-4 py-2 bg-gradient-to-r from-blue-500 to-blue-600 text-white text-sm font-medium rounded-lg hover:from-blue-600 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transition-all duration-200 shadow-lg cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>

          {/* Brands List */}
          <div className="mb-8">
            <h4 className="text-lg font-medium text-white mb-4">Brands</h4>
            <div className="max-w-2xl">
              {brands.length === 0 ? (
                <div className="text-center py-8 text-gray-400">
                  <p>No brands found. Add your first brand above.</p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {brands.map((brand) => (
                    <div
                      key={brand.id}
                      className="flex items-center gap-2 p-3 bg-white/5 backdrop-blur-sm border border-white/10 rounded-lg hover:bg-white/10 transition-all duration-200"
                    >
                      <span 
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium cursor-pointer transition-all duration-200 ${
                          brand.is_active
                            ? 'bg-green-500/20 text-green-300 border border-green-400/30 hover:bg-green-500/30'
                            : 'bg-gray-500/20 text-gray-300 border border-gray-400/30 hover:bg-gray-500/30'
                        }`}
                        onClick={() => toggleBrand(brand.id)}
                        title="Click to toggle active/inactive status"
                      >
                        {brand.is_active ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-sm font-medium text-white whitespace-nowrap">{brand.name}</span>
                      <button
                        onClick={() => handleDeleteClick(brand)}
                        className="p-1.5 bg-red-500/20 text-red-300 rounded-md hover:bg-red-500/30 border border-red-400/30 transition-all duration-200 cursor-pointer"
                        title="Delete brand"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
