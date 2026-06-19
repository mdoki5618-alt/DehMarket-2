import React, { useState, useEffect } from 'react';
import { Product, Invoice, Customer, CartItem } from './types';
import { 
  INITIAL_PRODUCTS, 
  INITIAL_INVOICES, 
  INITIAL_CUSTOMERS 
} from './sampleData';

import POSRegister from './components/POSRegister';
import InventoryManager from './components/InventoryManager';
import InvoiceList from './components/InvoiceList';
import CustomerAccounts from './components/CustomerAccounts';
import FinancialDashboard from './components/FinancialDashboard';
import ReceiptModal from './components/ReceiptModal';

import { 
  ShoppingCart, 
  Package, 
  Receipt, 
  Users, 
  TrendingUp, 
  Clock, 
  Calendar,
  DatabaseBackup,
  RefreshCw,
  Trash2,
  Bell,
  Volume2,
  Download,
  Upload
} from 'lucide-react';
import { playScanBeep, playCashRegisterSound, playErrorBeep } from './components/soundHelper';
import { getProductImageUrl, fetchOnlineProductImage } from './components/imageHelper';

type TabId = 'pos' | 'invoices' | 'inventory' | 'customers' | 'analytics';

export default function App() {
  // --- STATE INIT ---
  const [activeTab, setActiveTab] = useState<TabId>('pos');
  const [isDarkMode, setIsDarkMode] = useState<boolean>(true); // Active premium dark theme by default!
  const [products, setProducts] = useState<Product[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);

  // Selected Invoice for Thermal ticket preview modal
  const [viewingInvoice, setViewingInvoice] = useState<Invoice | null>(null);

  // Digital Clock state
  const [timeStr, setTimeStr] = useState<string>('');
  const [dateStr, setDateStr] = useState<string>('');

  // --- LOCAL PERSISTENCE LOADER ---
  useEffect(() => {
    try {
      const storedProducts = localStorage.getItem('supermarket_products');
      const storedInvoices = localStorage.getItem('supermarket_invoices');
      const storedCustomers = localStorage.getItem('supermarket_customers');

      if (storedProducts) {
        const parsed = JSON.parse(storedProducts) as Product[];
        const enriched = parsed.map(p => ({
          ...p,
          imageUrl: p.imageUrl || getProductImageUrl(p.name, p.category, p.id)
        }));
        setProducts(enriched);
      } else {
        const enriched = INITIAL_PRODUCTS.map(p => ({
          ...p,
          imageUrl: p.imageUrl || getProductImageUrl(p.name, p.category, p.id)
        }));
        setProducts(enriched);
      }

      if (storedInvoices) setInvoices(JSON.parse(storedInvoices));
      else setInvoices(INITIAL_INVOICES);

      if (storedCustomers) setCustomers(JSON.parse(storedCustomers));
      else setCustomers(INITIAL_CUSTOMERS);
    } catch (e) {
      console.error("Localstorage recovery failed, loading initial presets", e);
      const enriched = INITIAL_PRODUCTS.map(p => ({
        ...p,
        imageUrl: p.imageUrl || getProductImageUrl(p.name, p.category, p.id)
      }));
      setProducts(enriched);
      setInvoices(INITIAL_INVOICES);
      setCustomers(INITIAL_CUSTOMERS);
    }
  }, []);

  // --- PERSISTENCE SYNCRONIZERS ---
  const saveProducts = (updatedProds: Product[]) => {
    setProducts(updatedProds);
    localStorage.setItem('supermarket_products', JSON.stringify(updatedProds));
  };

  const saveInvoices = (updatedInvoices: Invoice[]) => {
    setInvoices(updatedInvoices);
    localStorage.setItem('supermarket_invoices', JSON.stringify(updatedInvoices));
  };

  const saveCustomers = (updatedCusts: Customer[]) => {
    setCustomers(updatedCusts);
    localStorage.setItem('supermarket_customers', JSON.stringify(updatedCusts));
  };

  // --- REAL-TIME CLOCK TICKER ---
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Persian date representation
      const df = new Intl.DateTimeFormat('fa-IR', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(now);
      
      const tf = now.toLocaleTimeString('fa-IR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      setDateStr(df);
      setTimeStr(tf);
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // --- REAL-TIME EXACT ONLINE IMAGE RESOLVER ---
  useEffect(() => {
    if (products.length === 0) return;

    // Find products that don't have a real exact online product image (including ones currently on generic Unsplash fallbacks)
    const productsToResolve = products.filter(
      (p) => !p.imageUrl || p.imageUrl.includes('unsplash.com')
    );

    if (productsToResolve.length === 0) return;

    let active = true;

    const resolveImages = async () => {
      let changed = false;
      const updatedProducts = [...products];

      for (const prod of productsToResolve) {
        if (!active) break;
        try {
          const onlineUrl = await fetchOnlineProductImage(prod.name, prod.id);
          if (onlineUrl && active) {
            const index = updatedProducts.findIndex((p) => p.id === prod.id);
            if (index !== -1) {
              updatedProducts[index] = {
                ...updatedProducts[index],
                imageUrl: onlineUrl
              };
              changed = true;
              
              // Dynamically update products state so they render immediately without refresh
              setProducts([...updatedProducts]);
            }
          }
        } catch (err) {
          console.error(`Failed to background-resolve image for product "${prod.name}":`, err);
        }
        // Brief spacing to prevent rate limits or browser network saturation
        await new Promise((r) => setTimeout(r, 600));
      }

      if (changed && active) {
        localStorage.setItem('supermarket_products', JSON.stringify(updatedProducts));
      }
    };

    resolveImages();

    return () => {
      active = false;
    };
  }, [products.length]);

  // --- DATABASE HELPERS / MUTATORS ---

  // Stocks reduction after checkout
  const handleUpdateStocksAfterSale = (cart: CartItem[]) => {
    const updated = products.map((prod) => {
      const cartMatch = cart.find((item) => item.product.id === prod.id);
      if (cartMatch) {
        return {
          ...prod,
          stock: Math.max(0, prod.stock - cartMatch.quantity),
        };
      }
      return prod;
    });
    saveProducts(updated);
  };

  // Quick addition of sudden custom item via barcode screen
  const handleQuickAddProduct = (newProd: Product) => {
    // Insert safely in database
    if (products.some((p) => p.id === newProd.id)) return;
    const enriched = {
      ...newProd,
      imageUrl: newProd.imageUrl || getProductImageUrl(newProd.name, newProd.category, newProd.id)
    };
    const list = [enriched, ...products];
    saveProducts(list);
  };

  // Standard Product entries modifications
  const handleAddProduct = (prod: Product) => {
    const enriched = {
      ...prod,
      imageUrl: prod.imageUrl || getProductImageUrl(prod.name, prod.category, prod.id)
    };
    const list = [enriched, ...products];
    saveProducts(list);
    playScanBeep();
  };

  const handleEditProduct = (prod: Product) => {
    const enriched = {
      ...prod,
      imageUrl: prod.imageUrl || getProductImageUrl(prod.name, prod.category, prod.id)
    };
    const list = products.map((p) => (p.id === prod.id ? enriched : p));
    saveProducts(list);
    playScanBeep();
  };

  const handleDeleteProduct = (id: string) => {
    const list = products.filter((p) => p.id !== id);
    saveProducts(list);
    playErrorBeep();
  };

  // Standard Customer accounts additions
  const handleAddCustomer = (cust: Customer) => {
    const list = [cust, ...customers];
    saveCustomers(list);
    playScanBeep();
  };

  // Log new credit/payment transaction to a specific customer dfter
  const handleAddDebtTransaction = (
    customerId: string, 
    amount: number, 
    desc: string,
    type: 'DEBT' | 'PAYMENT' = 'DEBT'
  ) => {
    const updated = customers.map((c) => {
      if (c.id === customerId) {
        const newTransaction = {
          id: 'TX-' + Math.floor(1000 + Math.random() * 9000),
          date: new Date().toISOString(),
          amount,
          type,
          description: desc,
        };
        return {
          ...c,
          transactions: [...c.transactions, newTransaction],
        };
      }
      return c;
    });
    saveCustomers(updated);
    if (type === 'PAYMENT') {
      playCashRegisterSound();
    } else {
      playScanBeep();
    }
  };

  // Clear specific customer history
  const handleClearCustomerTransactions = (customerId: string) => {
    const updated = customers.map((c) => {
      if (c.id === customerId) {
        return { ...c, transactions: [] };
      }
      return c;
    });
    saveCustomers(updated);
    playErrorBeep();
  };

  // Create Invoice and trigger receipt popup
  const handleAddInvoice = (newInv: Invoice) => {
    const list = [newInv, ...invoices];
    saveInvoices(list);
    
    // Auto-summon thermal receipt preview for this sale immediately!
    setViewingInvoice(newInv);
  };

  // Cancel/Delete active Invoice (restores stock!)
  const handleDeleteInvoice = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return;

    // Restore stock values
    const restoredProds = products.map((prod) => {
      const soldMatch = inv.items.find((item) => item.productId === prod.id);
      if (soldMatch) {
        return {
          ...prod,
          stock: prod.stock + soldMatch.quantity,
        };
      }
      return prod;
    });

    // If it was a DEBT invoice, append an offsets correction transaction reducing customer debt
    if (inv.paymentMethod === 'DEBT') {
      const matchCust = customers.find((c) => c.name === inv.customerName && c.phone === (inv.customerPhone || ''));
      if (matchCust) {
        // Add correction payment of equal value
        handleAddDebtTransaction(
          matchCust.id,
          inv.totalBill,
          `کاهش کسر بدهی بابت ابطال فاکتور مرجوعی ${invoiceId}`,
          'PAYMENT'
        );
      }
    }

    const list = invoices.filter((i) => i.id !== invoiceId);
    saveInvoices(list);
    saveProducts(restoredProds);
    playErrorBeep();
  };

  // --- DATABASE UTILITIES (BACKUPS / RESETS) ---

  const handleExportBackup = () => {
    try {
      const db = {
        products,
        invoices,
        customers
      };
      const json = JSON.stringify(db, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `supermarket-accounting-backup-${new Date().toISOString().slice(0,10)}.json`;
      link.click();
      playScanBeep();
    } catch (e) {
      alert('خطا در پشتیبان‌گیری فایل پشتیبان');
    }
  };

  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const raw = evt.target?.result as string;
        const parsed = JSON.parse(raw);
        
        if (parsed.products && parsed.invoices && parsed.customers) {
          saveProducts(parsed.products);
          saveInvoices(parsed.invoices);
          saveCustomers(parsed.customers);
          playCashRegisterSound();
          alert('پشتیبان‌گیری از دیتابیس با موفقیت بازنشانی شد!');
        } else {
          playErrorBeep();
          alert('ساختار فایل پشتیبان معتبر نمی‌باشد.');
        }
      } catch (err) {
        playErrorBeep();
        alert('خطا در خواندن فایل پشتیبان.');
      }
    };
    reader.readAsText(file);
  };

  const handleResetEntireDatabase = () => {
    if (window.confirm('آیا از بازنشانی کامل مغازه مطمئن هستید؟ با این کار کل فاکتورها، انبارداری و اسناد بدهکاران حذف و دیتابیس پیش‌فرض بارگذاری خواهد شد.')) {
      localStorage.clear();
      saveProducts(INITIAL_PRODUCTS);
      saveInvoices(INITIAL_INVOICES);
      saveCustomers(INITIAL_CUSTOMERS);
      playCashRegisterSound();
      alert('کل دیتابیس با موفقیت بازنشانی و به دمو نمونه ایرانی تغییر یافت.');
    }
  };

  // Calculate global alerts counts for flashing indicators
  const lowStocksCount = products.filter((p) => p.stock <= p.minStock).length;

  return (
    <div className={`min-h-screen flex flex-col antialiased print:bg-white select-none transition-colors duration-300 ${isDarkMode ? 'dark bg-slate-950 text-slate-100' : 'bg-[#f8fafc] text-slate-850'}`}>
      
      {/* 1. PROFESSIONAL CASHIER HEADER PANEL (Hidden on thermal printing) */}
      <header className="h-14 bg-white border-b border-slate-200 dark:bg-slate-900 dark:border-slate-800/80 flex items-center justify-between px-6 shrink-0 print:hidden select-none transition-colors duration-300">
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          
          {/* Brand logo & Shop title */}
          <div className="flex items-center gap-4">
            <div className="bg-blue-600 dark:bg-blue-700 text-white px-2.5 py-1 rounded-lg font-bold text-xs tracking-tight shadow-md">صندوق تجاری v2.4</div>
            <div className="h-8 w-px bg-slate-200 dark:bg-slate-800"></div>
            <div className="text-right">
              <h1 className="text-xs md:text-sm font-bold tracking-tight text-slate-850 dark:text-slate-100 font-sans flex flex-wrap items-center gap-1.5 leading-tight">
                <span>صندوق مکانیزه فروش و حسابداری</span>
                <span className="inline-flex items-center px-2.5 py-0.5 bg-slate-100 dark:bg-slate-800/70 backdrop-blur-md border border-slate-200 dark:border-slate-700/60 rounded-md text-blue-600 dark:text-amber-400 font-black shadow-inner transition-all relative">
                  سوپرمارکت ده مارکت
                  <span className="absolute -inset-0.5 bg-blue-500/10 dark:bg-amber-400/5 rounded-md blur-xs pointer-events-none"></span>
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 dark:text-slate-500 font-sans mt-0.5">سیستم مدیریت مالی، بارکدخوان هوشمند، مانیتورینگ فاکتور و خروجی اکسل فاکتورها</p>
            </div>
          </div>

          {/* Theme Switcher & Real-time Ticking Digital Watch */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                setIsDarkMode(!isDarkMode);
                playScanBeep();
              }}
              className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-amber-400 border border-slate-200 dark:border-slate-700 transition-all duration-150 cursor-pointer flex items-center gap-1.5 text-xs font-bold font-sans shadow-3xs"
              title="تغییر پوسته بصری برنامه (روز / شب)"
            >
              {isDarkMode ? '☀️ پوسته روشن (روز)' : '🌙 پوسته تاریک (شب)'}
            </button>

            <div className="flex items-center gap-3 text-right border-r pr-3 border-slate-200 dark:border-slate-800 font-sans">
              <div className="flex flex-col items-end">
                <span className="text-[10px] text-slate-750 dark:text-slate-200 font-black leading-none">{timeStr}</span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 mt-1">{dateStr}</span>
              </div>
            </div>
          </div>

        </div>
      </header>

      {/* 2. PERSISTENT NAV TABS SYSTEM BAR */}
      <nav className="bg-white border-b border-slate-200 dark:bg-slate-900/95 dark:border-slate-800/80 py-2 px-6 print:hidden shadow-sm select-none transition-colors duration-300">
        <div className="max-w-7xl mx-auto flex flex-wrap justify-between items-center gap-4 font-sans text-right" dir="rtl">
          
          {/* Navigation link buttons */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            {[
              { id: 'pos' as TabId, label: '🛒 صندوق فروشگاهی', icon: ShoppingCart },
              { id: 'invoices' as TabId, label: '🧾 دفتر ثبت فاکتورها', icon: Receipt },
              { id: 'inventory' as TabId, label: '📦 مدیریت انبارداری', icon: Package, badge: lowStocksCount > 0 ? lowStocksCount : undefined },
              { id: 'customers' as TabId, label: '📔 دفتر نسیه و بدهکاران', icon: Users },
              { id: 'analytics' as TabId, label: '📈 گزارشات سود و سرمایه', icon: TrendingUp },
            ].map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  id={`tab-btn-${tab.id}`}
                  onClick={() => { setActiveTab(tab.id); playScanBeep(); }}
                  className={`px-4 py-1.5 rounded-md font-medium text-xs flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap select-none relative ${
                    isActive
                      ? 'bg-blue-50 text-blue-705 font-bold border border-blue-100 shadow-3xs dark:bg-slate-800 dark:text-amber-400 dark:border-amber-400/20'
                      : 'text-slate-550 hover:text-slate-800 hover:bg-slate-50 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800/40 border border-transparent'
                  }`}
                >
                  <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-blue-600 dark:text-amber-400' : 'text-slate-450 dark:text-slate-500'}`} />
                  <span>{tab.label}</span>
                  
                  {/* Flashing stock order indicators */}
                  {tab.badge !== undefined && (
                    <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-amber-500 text-white animate-pulse mr-1">
                      {tab.badge.toLocaleString('fa-IR')}
                    </span>
                  )}
                </button>
              );
            })}
          </div>

          {/* Databanks backups, recoveries & resets actions bar */}
          <div className="flex items-center gap-2 border-r border-slate-200 dark:border-slate-800 pr-2 select-none">
            
            {/* Load Backups */}
            <label className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800/80 rounded-md text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1">
              <Upload className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>بازیابی اطلاعات</span>
              <input 
                type="file" 
                accept=".json" 
                onChange={handleImportBackup} 
                className="hidden" 
              />
            </label>

            {/* Save Backup */}
            <button
              onClick={handleExportBackup}
              className="px-2.5 py-1.5 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 dark:bg-slate-900 dark:border-slate-800 dark:text-slate-350 dark:hover:bg-slate-800/80 rounded-md text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1"
              title="بارگیری فایل پشتیبان کامل سیستم مالی"
            >
              <Download className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
              <span>پشتیبان‌گیری</span>
            </button>

            {/* Database Hard reset */}
            <button
              onClick={handleResetEntireDatabase}
              className="px-2.5 py-1.5 bg-red-50 hover:bg-red-105 text-red-700 hover:border-red-300 border border-red-100 dark:bg-rose-950/20 dark:hover:bg-rose-900/30 dark:text-rose-450 dark:border-rose-900/40 rounded-md text-[10.5px] font-bold cursor-pointer transition-all flex items-center gap-1"
              title="پاک کردن کل اطلاعات و راه‌اندازی با محصولات دمو"
            >
              <RefreshCw className="w-3.5 h-3.5 text-red-500 dark:text-rose-450" />
              <span>بازنشانی انبار</span>
            </button>

          </div>

        </div>
      </nav>

      {/* 3. ACTIVE TAB MAIN WORKPLACE STAGE */}
      <main className="flex-1 overflow-y-auto p-4 max-w-7xl w-full mx-auto print:p-0 print:overflow-visible">
        
        {activeTab === 'pos' && (
          <POSRegister
            products={products}
            customers={customers}
            invoiceHistory={invoices}
            onAddInvoice={handleAddInvoice}
            onUpdateStocksAfterSale={handleUpdateStocksAfterSale}
            onAddDebtTransaction={handleAddDebtTransaction}
            onQuickAddProduct={handleQuickAddProduct}
            onAddCustomer={handleAddCustomer}
            onEditProduct={handleEditProduct}
          />
        )}

        {activeTab === 'invoices' && (
          <InvoiceList
            invoices={invoices}
            onDeleteInvoice={handleDeleteInvoice}
            onViewInvoice={(inv) => setViewingInvoice(inv)}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryManager
            products={products}
            onAddProduct={handleAddProduct}
            onEditProduct={handleEditProduct}
            onDeleteProduct={handleDeleteProduct}
          />
        )}

        {activeTab === 'customers' && (
          <CustomerAccounts
            customers={customers}
            onAddCustomer={handleAddCustomer}
            onAddDebtTransaction={handleAddDebtTransaction}
            onClearCustomerTransactions={handleClearCustomerTransactions}
          />
        )}

        {activeTab === 'analytics' && (
          <FinancialDashboard
            products={products}
            invoices={invoices}
            customers={customers}
          />
        )}

      </main>

      {/* 4. EXCLUSIVE THERMAL RECEIPT MODAL (SUMMONED GLOBALLY BY ACTIONS) */}
      {viewingInvoice && (
        <ReceiptModal
          invoice={viewingInvoice}
          onClose={() => setViewingInvoice(null)}
        />
      )}

      {/* 5. BOTTOM SHORTCUT BAR */}
      <footer className="h-12 bg-slate-900 border-t border-slate-800 flex items-center px-6 justify-between shrink-0 print:hidden text-slate-300">
        <div className="flex gap-4">
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-bold">F1</span>
            <span className="text-[11px] text-slate-300">اسکن بارکد</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-bold">F2</span>
            <span className="text-[11px] text-slate-300">تسویه نقدی</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="bg-slate-800 text-white px-2 py-0.5 rounded text-[10px] font-bold">F3</span>
            <span className="text-[11px] text-slate-300">تخفیف کلی</span>
          </div>
        </div>
        <div className="flex items-center gap-4 text-slate-400 text-[11px]">
          <div className="flex items-center gap-1.5 select-none">
            <Volume2 className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>صندوق صوتی متصل</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
            <span>پایانه متصل</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-500"></span>
            <span>همگام‌سازی ابری</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
