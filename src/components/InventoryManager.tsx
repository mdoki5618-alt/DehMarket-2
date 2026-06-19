import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { CATEGORIES, UNITS } from '../sampleData';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Tag, 
  AlertTriangle, 
  SlidersHorizontal,
  Layers,
  ArrowUpDown,
  TrendingUp,
  Package,
  RotateCcw,
  FileSpreadsheet
} from 'lucide-react';
import { formatPersianNumber } from './ReceiptModal';
import { checkExpiryState, getExpirySortValue } from './dateHelper';

interface InventoryManagerProps {
  products: Product[];
  onAddProduct: (prod: Product) => void;
  onEditProduct: (prod: Product) => void;
  onDeleteProduct: (id: string) => void;
}

export default function InventoryManager({
  products,
  onAddProduct,
  onEditProduct,
  onDeleteProduct,
}: InventoryManagerProps) {
  // filters
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('همه');
  const [stockFilter, setStockFilter] = useState<'ALL' | 'LOW' | 'OUT_OF_STOCK'>('ALL');
  const [sortBy, setSortBy] = useState<'NONE' | 'NAME' | 'STOCK_ASC' | 'STOCK_DESC' | 'EXPIRY_ASC' | 'EXPIRY_DESC' | 'ONLY_EXPIRED'>('NONE');

  // product form state
  const [showFormModal, setShowFormModal] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Form Fields
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [prodCategory, setProdCategory] = useState(CATEGORIES[0]);
  const [buyPrice, setBuyPrice] = useState<number>(0);
  const [sellPrice, setSellPrice] = useState<number>(0);
  const [stock, setStock] = useState<number>(0);
  const [minStock, setMinStock] = useState<number>(5);
  const [unit, setUnit] = useState(UNITS[0]);
  const [imageUrl, setImageUrl] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [expYear, setExpYear] = useState('');
  const [expMonth, setExpMonth] = useState('');
  const [expDay, setExpDay] = useState('');

  // Auto-compose expiryDate string from individual year, month, and day controls
  useEffect(() => {
    if (expYear && expYear.trim()) {
      const cleanY = expYear.trim();
      const cleanM = expMonth ? expMonth.trim().padStart(2, '0') : '01';
      const cleanD = expDay ? expDay.trim().padStart(2, '0') : '01';
      setExpiryDate(`${cleanY}/${cleanM}/${cleanD}`);
    } else {
      setExpiryDate('');
    }
  }, [expYear, expMonth, expDay]);

  const openAddForm = () => {
    setEditingProduct(null);
    setId(Math.floor(100000 + Math.random() * 900000).toString()); // random barcode starter
    setName('');
    setProdCategory(CATEGORIES[0]);
    setBuyPrice(0);
    setSellPrice(0);
    setStock(10);
    setMinStock(5);
    setUnit(UNITS[0]);
    setImageUrl('');
    setExpiryDate('');
    setExpYear('');
    setExpMonth('');
    setExpDay('');
    setShowFormModal(true);
  };

  const openEditForm = (prod: Product) => {
    setEditingProduct(prod);
    setId(prod.id);
    setName(prod.name);
    setProdCategory(prod.category);
    setBuyPrice(prod.buyPrice);
    setSellPrice(prod.sellPrice);
    setStock(prod.stock);
    setMinStock(prod.minStock);
    setUnit(prod.unit);
    setImageUrl(prod.imageUrl || '');
    setExpiryDate(prod.expiryDate || '');
    
    if (prod.expiryDate) {
      const parts = prod.expiryDate.replace(/[-\.]/g, '/').split('/');
      setExpYear(parts[0] || '');
      setExpMonth(parts[1] ? parts[1].padStart(2, '0') : '');
      setExpDay(parts[2] ? parts[2].padStart(2, '0') : '');
    } else {
      setExpYear('');
      setExpMonth('');
      setExpDay('');
    }
    setShowFormModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || buyPrice < 0 || sellPrice < 0) {
      alert('لطفا جزئیات معتبری برای محصول وارد کنید.');
      return;
    }

    // Validate if already expired to trigger warning alert (اخطار)
    if (expiryDate.trim()) {
      const status = checkExpiryState(expiryDate.trim());
      if (status.expired) {
        const confirmSave = window.confirm(
          `🚨 توجه! تاریخ انقضای این کالا فرارسیده یا گذشته است (${expiryDate.trim()}).\nآیا با وجود انقضا، مایل به ثبت آن هستید؟`
        );
        if (!confirmSave) return;
      }
    }

    const payload: Product = {
      id: id.trim(),
      name: name.trim(),
      category: prodCategory,
      buyPrice,
      sellPrice,
      stock,
      minStock,
      unit,
      imageUrl: imageUrl.trim() || undefined,
      expiryDate: expiryDate.trim() || undefined,
    };

    if (editingProduct) {
      onEditProduct(payload);
    } else {
      // Check duplicate barcode
      if (products.some((p) => p.id === payload.id)) {
        alert('این بارکد یا کد کالا از قبل در انبار ثبت شده است.');
        return;
      }
      onAddProduct(payload);
    }
    setShowFormModal(false);
  };

  const handleDelete = (prodId: string, prodName: string) => {
    if (window.confirm(`آیا از حذف کالا "${prodName}" از سیستم انبارداری مطمئن هستید؟`)) {
      onDeleteProduct(prodId);
    }
  };

  const handleExportExcel = () => {
    if (filteredProducts.length === 0) {
      alert("هیچ کالایی برای خروجی اکسل وجود ندارد.");
      return;
    }

    const headers = [
      "بارکد / کد کالا",
      "نام کالا",
      "دسته‌بندی",
      "قیمت خرید (تومان)",
      "قیمت فروش (تومان)",
      "سود هر واحد (تومان)",
      "درصد سود هر واحد",
      "موجودی انبار",
      "واحد",
      "ارزش سرمایه خرید این کالا (تومان)",
      "ارزش ناخالص فروش کالا (تومان)",
      "سود کل انبار از این کالا (تومان)"
    ];

    const rows = filteredProducts.map(p => {
      const profitAmt = p.sellPrice - p.buyPrice;
      const profitPct = p.buyPrice > 0 ? Math.round((profitAmt / p.buyPrice) * 100) : 0;
      const totalBuyVal = p.buyPrice * p.stock;
      const totalSellVal = p.sellPrice * p.stock;
      const totalProfitVal = profitAmt * p.stock;
      return [
        p.id,
        p.name,
        p.category,
        p.buyPrice,
        p.sellPrice,
        profitAmt,
        profitPct + "%",
        p.stock,
        p.unit,
        totalBuyVal,
        totalSellVal,
        totalProfitVal
      ];
    });

    let csvContent = "\uFEFF"; // UTF-8 BOM
    csvContent += headers.join(",") + "\n";
    rows.forEach(row => {
      const sanitizedRow = row.map(val => {
        const textVal = String(val);
        if (textVal.includes(",") || textVal.includes('"') || textVal.includes("\n")) {
          return `"${textVal.replace(/"/g, '""')}"`;
        }
        return textVal;
      });
      csvContent += sanitizedRow.join(",") + "\n";
    });

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dah-market-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filter and sorting application
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.id.includes(search);
    const matchesCategory = category === 'همه' || p.category === category;
    
    let matchesStock = true;
    if (stockFilter === 'LOW') {
      matchesStock = p.stock > 0 && p.stock <= p.minStock;
    } else if (stockFilter === 'OUT_OF_STOCK') {
      matchesStock = p.stock === 0;
    }

    let matchesExpired = true;
    if (sortBy === 'ONLY_EXPIRED') {
      matchesExpired = p.expiryDate ? checkExpiryState(p.expiryDate).expired : false;
    }

    return matchesSearch && matchesCategory && matchesStock && matchesExpired;
  }).sort((a, b) => {
    if (sortBy === 'NAME') {
      return a.name.localeCompare(b.name, 'fa');
    }
    if (sortBy === 'STOCK_ASC') {
      return a.stock - b.stock;
    }
    if (sortBy === 'STOCK_DESC') {
      return b.stock - a.stock;
    }
    if (sortBy === 'EXPIRY_ASC') {
      const scoreA = getExpirySortValue(a.expiryDate);
      const scoreB = getExpirySortValue(b.expiryDate);
      return scoreA - scoreB;
    }
    if (sortBy === 'EXPIRY_DESC') {
      const scoreA = getExpirySortValue(a.expiryDate);
      const scoreB = getExpirySortValue(b.expiryDate);
      if (scoreA === 99999999 && scoreB !== 99999999) return 1;
      if (scoreB === 99999999 && scoreA !== 99999999) return -1;
      return scoreB - scoreA;
    }
    return 0;
  });

  return (
    <div className="space-y-4 text-right font-sans" dir="rtl">
      
      {/* Title Bar & Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <div>
          <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2">
            <span className="w-1.5 h-4 bg-blue-600 rounded-sm"></span>
            انبارداری و مدیریت کالاها
          </h2>
          <p className="text-[11px] text-slate-400 mt-1">مدیریت موجودی، ثبت کدهای بارکد، تغییر قیمت خرید/فروش و درصد سود کالاها</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all border-b-2 border-emerald-800"
            title="خروجی گرفتن از کل موجودی و سرمایه انبار به صورت شیت اکسل"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>خروجی اکسل موجودی</span>
          </button>
          
          <button
            onClick={openAddForm}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-lg flex items-center gap-1.5 shadow-xs cursor-pointer transition-all border-b-2 border-blue-800"
          >
            <Plus className="w-4 h-4" />
            ثبت کالای جدید در انبار
          </button>
        </div>
      </div>

      {/* Database control filters bar */}
      <div className="bg-white p-3 border border-slate-200 rounded-xl shadow-xs">
        
        {/* Row 1: Search, Categorization, Stock Filter & Safe Expiry Sorting */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          
          <div className="relative">
            <input
              type="text"
              placeholder="جستجو نام یا بارکد کالا..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 rounded-lg text-xs outline-none transition-all placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full p-2 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 rounded-lg text-xs outline-none cursor-pointer text-slate-700 font-medium"
            >
              <option value="همه">همه دسته‌بندی‌ها</option>
              {CATEGORIES.map((c, i) => <option key={i} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="w-full p-2 bg-indigo-50 border border-slate-200 focus:ring-2 focus:ring-indigo-500 text-indigo-950 font-bold rounded-lg text-xs outline-none cursor-pointer"
            >
              <option value="NONE">🔍 ترتیب پیش‌فرض (زمان ثبت)</option>
              <option value="NAME">🔤 حروف الفبا (نام کالا)</option>
              <option value="STOCK_ASC">📉 موجودی انبار (کم به زیاد)</option>
              <option value="STOCK_DESC">📈 موجودی انبار (زیاد به کم)</option>
              <option value="EXPIRY_ASC">🗓️ تاریخ انقضا (نزولی - نزدیک‌ترین)</option>
              <option value="EXPIRY_DESC">🗓️ تاریخ انقضا (صعودی - دورترین)</option>
              <option value="ONLY_EXPIRED">🚨 فقط نمایش اقلام منقضی شده</option>
            </select>
          </div>

          <div className="flex gap-1">
            {[
              { id: 'ALL' as const, label: 'همه اقلام' },
              { id: 'LOW' as const, label: '⚠️ کسری' },
              { id: 'OUT_OF_STOCK' as const, label: '❌ اتمام' },
            ].map((st) => (
              <button
                key={st.id}
                onClick={() => setStockFilter(st.id)}
                className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold border transition-all cursor-pointer ${
                  stockFilter === st.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

        </div>
      </div>

      {/* MAIN PRODUCTS DATABASE TABLE */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold text-[10.5px] select-none">
                <th className="p-3 font-bold text-center">بارکد</th>
                <th className="p-3 font-bold">نام کالا</th>
                <th className="p-3 font-bold">دسته‌بندی</th>
                <th className="p-3 font-bold text-center font-mono">قیمت خرید</th>
                <th className="p-3 font-bold text-center font-mono">قیمت فروش</th>
                <th className="p-3 font-bold text-center">سود خالص</th>
                <th className="p-3 font-bold text-center">موجودی</th>
                <th className="p-3 font-bold text-center">وضعیت انبار</th>
                <th className="p-3 font-bold text-center print:hidden">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-gray-400 font-sans">
                    <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                    هیچ کالایی در انبار ثبت نشده یا متناسب با فیلتر شما یافت نشد.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const profitAmt = p.sellPrice - p.buyPrice;
                  const profitPct = p.buyPrice > 0 ? Math.round((profitAmt / p.buyPrice) * 100) : 0;
                  const isLow = p.stock > 0 && p.stock <= p.minStock;
                  const isOut = p.stock === 0;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      
                      {/* Barcode / ID */}
                      <td className="p-3 text-center font-mono text-slate-500 font-medium whitespace-nowrap">
                        {p.id}
                      </td>
                      
                      {/* Name & Unit */}
                      <td className="p-3 font-bold text-slate-800 dark:text-slate-100">
                        <div className="flex items-center gap-2.5">
                          <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0 border border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                            {p.imageUrl ? (
                              <img src={p.imageUrl} alt={p.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                            ) : (
                              <Package className="w-5 h-5 text-slate-400 dark:text-slate-500" />
                            )}
                          </div>
                          <div>
                            <span className="block font-bold leading-tight">{p.name}</span>
                            <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                              <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal block">
                                واحد فروش: {p.unit}
                              </span>
                              {p.expiryDate && (() => {
                                const status = checkExpiryState(p.expiryDate);
                                return (
                                  <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[9.5px] font-black leading-none ${
                                    status.expired
                                      ? 'bg-red-55 text-red-700 border border-red-200'
                                      : status.nearExpiry
                                        ? 'bg-amber-55 text-amber-700 border border-amber-200'
                                        : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                                  }`}>
                                    انقضا: {p.expiryDate} ({status.label})
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="p-3 text-slate-600 font-medium">{p.category}</td>

                      {/* Buy Price */}
                      <td className="p-3 text-center text-slate-700 text-sm md:text-base font-bold font-mono">
                        {p.buyPrice.toLocaleString('fa-IR')} <span className="text-[10px] text-slate-400 font-sans">ت</span>
                      </td>

                      {/* Sell Price */}
                      <td className="p-3 text-center text-indigo-700 dark:text-indigo-400 text-base md:text-lg font-black font-mono">
                        {p.sellPrice.toLocaleString('fa-IR')} <span className="text-[10px] text-indigo-500 font-sans font-bold">تومان</span>
                      </td>

                      {/* Markup Profit Info */}
                      <td className="p-3 text-center font-mono">
                        <span className="text-emerald-700 font-bold block text-[11px]">
                          +{profitAmt.toLocaleString('fa-IR')} ت
                        </span>
                        <span className="text-[9.5px] text-slate-400 font-sans">
                          سود: {profitPct.toLocaleString('fa-IR')}%
                        </span>
                      </td>

                      {/* Quantitative Stock counts */}
                      <td className="p-3 text-center font-mono font-bold text-slate-700">
                        {p.stock.toLocaleString('fa-IR')} {p.unit}
                      </td>

                      {/* Warehouse stock alerts visual */}
                      <td className="p-3 text-center">
                        {isOut ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold bg-rose-55 text-rose-700">
                            🔴 اتمام جنس
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-55 text-amber-700">
                            ⚠️ رو به اتمام
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700">
                            🟢 موجود کافی
                          </span>
                        )}
                      </td>

                      {/* Row actions */}
                      <td className="p-3 text-center print:hidden">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => openEditForm(p)}
                            className="p-1 px-2 border border-slate-200 hover:border-blue-400 bg-white text-slate-700 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-bold text-[10.5px]"
                          >
                            <Edit className="w-3 h-3 text-blue-600" />
                            ویرایش
                          </button>
                          <button
                            onClick={() => handleDelete(p.id, p.name)}
                            className="p-1 px-2 border border-slate-200 hover:border-red-450 bg-white text-rose-650 rounded-md transition-colors cursor-pointer flex items-center gap-1 font-bold text-[10.5px]"
                          >
                            <Trash2 className="w-3 h-3 text-rose-600" />
                            حذف
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL: Add or Edit Products database entries */}
      {showFormModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-6 text-right animate-fade-in font-sans">
            
            <h3 className="font-black text-slate-900 border-b border-gray-100 pb-3 flex items-center justify-start gap-2 text-sm md:text-base">
              <Package className="w-5 h-5 text-slate-800" />
              {editingProduct ? `ویرایش اطلاعات کالا: ${editingProduct.name}` : 'ثبت مشخصات کالا در انبار'}
            </h3>

            <div className="my-5 space-y-4">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">کد اختصاصی / بارکد کالا:</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingProduct} // keep identifier locked to protect invoices consistency
                    placeholder="کد اسکنر بارکد"
                    value={id}
                    onChange={(e) => setId(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs font-mono font-medium tracking-wide disabled:opacity-60"
                  />
                  {!editingProduct && (
                    <span className="text-[10px] text-gray-400">می‌توانید کلاسیفیک بارکد تپ کنید یا بگذارید تصادفی پر شود.</span>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">دسته‌بندی موضوعی:</label>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-hidden text-xs cursor-pointer"
                  >
                    {CATEGORIES.map((cat, idx) => <option key={idx} value={cat}>{cat}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500">نام تجاری کالا:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: نوشابه رژیمی قوطی کوکاکولا ۳۳۰ میل"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs font-medium"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">قیمت خرید کالا (تومان):</label>
                  <input
                    type="number"
                    required
                    placeholder="قیمت ست‌شده فاکتور خرید"
                    value={buyPrice || ''}
                    onChange={(e) => setBuyPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">قیمت فروش مصرف‌کننده (تومان):</label>
                  <input
                    type="number"
                    required
                    placeholder="قیمتی که پشت صندوق فروخته می‌شود"
                    value={sellPrice || ''}
                    onChange={(e) => setSellPrice(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">واحد شمارش فروشگاه:</label>
                  <select
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 rounded-xl outline-hidden text-xs cursor-pointer"
                  >
                    {UNITS.map((u, i) => <option key={i} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">موجودی انبار فعلی:</label>
                  <input
                    type="number"
                    required
                    placeholder="تعداد فیزیکی موجود"
                    value={stock}
                    onChange={(e) => setStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs font-mono"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-gray-500">حداقل موجودی برای هشدار:</label>
                  <input
                    type="number"
                    required
                    placeholder="نقطه سفارش کسر انبار"
                    value={minStock}
                    onChange={(e) => setMinStock(parseInt(e.target.value) || 0)}
                    className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs font-mono"
                  />
                </div>
              </div>

              {/* Margins forecast feedback */}
              {sellPrice > buyPrice && (
                <div className="p-3 bg-emerald-50 dark:bg-emerald-900/20 rounded-xl border border-emerald-100 dark:border-emerald-800/50 flex items-center justify-between text-xs text-emerald-800 dark:text-emerald-300 font-medium font-sans">
                  <span>سود ناخالص هر واحد واحد از فروش این کالا:</span>
                  <span className="font-bold">{(sellPrice - buyPrice).toLocaleString('fa-IR')} تومان ({Math.round(((sellPrice - buyPrice) / buyPrice) * 100).toLocaleString('fa-IR')}% حاشیه سود)</span>
                </div>
              )}

              <div className="space-y-2 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800/80">
                <label className="text-xs font-black text-slate-755 dark:text-slate-200 block">🗓️ درج روز، ماه و سال تاریخ انقضا (صرفاً فرآیند ورود عددی):</label>
                
                <div className="grid grid-cols-3 gap-2">
                  {/* Year Input */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">سال (مثال: ۱۴۰۵ یا 2026):</span>
                    <input
                      type="number"
                      placeholder="سال"
                      value={expYear}
                      onChange={(e) => setExpYear(e.target.value)}
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-xs text-center font-mono font-bold focus:border-indigo-500"
                    />
                  </div>

                  {/* Month Input */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">ماه (۱ تا ۱۲):</span>
                    <input
                      type="number"
                      placeholder="ماه"
                      value={expMonth}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 12)) {
                          setExpMonth(val);
                        }
                      }}
                      min="1"
                      max="12"
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-xs text-center font-mono font-bold focus:border-indigo-500"
                    />
                  </div>

                  {/* Day Input */}
                  <div className="space-y-1">
                    <span className="text-[10px] text-slate-400 block font-bold">روز (۱ تا ۳۱):</span>
                    <input
                      type="number"
                      placeholder="روز"
                      value={expDay}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || (parseInt(val) >= 1 && parseInt(val) <= 31)) {
                          setExpDay(val);
                        }
                      }}
                      min="1"
                      max="31"
                      className="w-full p-2 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-lg outline-none text-xs text-center font-mono font-bold focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between">
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed font-sans">
                    تاریخ نهایی انقضا: <span className="font-extrabold underline font-mono text-indigo-600 dark:text-indigo-400">{expiryDate || 'ثبت نشده'}</span>
                  </div>
                  {expiryDate && (() => {
                    const status = checkExpiryState(expiryDate);
                    return (
                      <span className={`px-2 py-0.5 rounded text-[9.5px] font-black ${
                        status.expired 
                          ? 'bg-red-100 text-red-700 border border-red-200' 
                          : status.nearExpiry 
                            ? 'bg-amber-100 text-amber-700 border border-amber-200' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-250'
                      }`}>
                        {status.label}
                      </span>
                    );
                  })()}
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-500 block">آدرس اینترنتی تصویر محصول (اختیاری):</label>
                <input
                  type="url"
                  placeholder="https://example.com/item.jpg"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-xl outline-hidden text-xs font-mono text-left"
                />
                <span className="text-[10px] text-gray-400 block mt-1 leading-relaxed">
                  💡 در صورت خالی گذاشتن، سیستم تصویر مرتبط با موضوع سوپرمارکتی را به طور پویا و هوشمند برای آن تنظیم می‌کند.
                </span>
              </div>

            </div>

            <div className="flex gap-3 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowFormModal(false)}
                className="w-1/3 py-2.5 border border-gray-250 text-gray-500 hover:bg-gray-50 rounded-xl text-xs font-bold cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="w-2/3 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-99"
              >
                {editingProduct ? 'ذخیره اصلاحات انبارداری' : 'افزودن قطعی به انبار فروشگاه'}
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
