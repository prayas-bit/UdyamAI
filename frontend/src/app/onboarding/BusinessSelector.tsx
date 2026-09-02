'use client';

import { useEffect, useState } from 'react';
import { Store, Loader2 } from 'lucide-react';
import { getBusinessCategories, BusinessCategory } from '@/lib/api';

interface BusinessSelectorProps {
  businessCategoryId: string;
  setBusinessCategoryId: (value: string) => void;
}

export default function BusinessSelector({
  businessCategoryId,
  setBusinessCategoryId,
}: BusinessSelectorProps) {
  const [categories, setCategories] = useState<BusinessCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    async function loadCategories() {
      setLoading(true);
      setLoadError(null);
      try {
        const apiCategories = await getBusinessCategories();
        setCategories(apiCategories.filter((c) => c.active !== false));
        if (apiCategories.length === 0) {
          setLoadError('No business categories found in the database. Run data import scripts first.');
        }
      } catch {
        setLoadError('Failed to load business categories from the API.');
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, []);

  return (
    <div className="flex gap-4">
      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
        <Store size={21} aria-hidden="true" />
      </div>

      <div className="w-full">
        <h4 className="font-semibold text-slate-900">
          2. Choose your business
        </h4>

        <p className="mt-1 text-sm text-slate-500">
          Select the business category you want to analyze.
        </p>
        {loadError && <p className="mt-2 text-sm text-red-600">{loadError}</p>}

        <div className="relative mt-4">
          <select
            value={businessCategoryId}
            onChange={(e) => setBusinessCategoryId(e.target.value)}
            disabled={loading}
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:bg-slate-100"
          >
            <option value="">
              {loading ? 'Loading business categories...' : 'Select business'}
            </option>
            {categories.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
          {loading && (
            <Loader2 className="absolute right-3 top-3.5 h-4 w-4 animate-spin text-slate-400" />
          )}
        </div>
      </div>
    </div>
  );
}