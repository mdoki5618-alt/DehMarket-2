import React, { useState, useRef, useEffect } from 'react';
import { Product, CartItem, Customer, PaymentMethod, Invoice } from '../types';
import { playScanBeep, playErrorBeep, playCashRegisterSound } from './soundHelper';
import { CATEGORIES, UNITS } from '../sampleData';
import { 
  Search, 
  Plus, 
  Trash2, 
  User, 
  Check, 
  CreditCard, 
  DollarSign, 
  BookOpen, 
  Tag, 
  TrendingDown, 
  AlertCircle,
  PackageCheck,
  ShoppingCart
} from 'lucide-react';
import { formatPersianNumber } from './ReceiptModal';
import { checkExpiryState } from './dateHelper';
import { normalizeBarcode } from './barcodeHelper';

interface POSRegisterProps {
  products: Product[];
  customers: Customer[];
  invoiceHistory: Invoice[];
  onAddInvoice: (invoice: Invoice) => void;
  onUpdateStocksAfterSale: (cart: CartItem[]) => void;
  onAddDebtTransaction: (customerId: string, amount: number, desc: string, type?: 'DEBT' | 'PAYMENT') => void;
  onQuickAddProduct: (prod: Product) => void;
  onAddCustomer: (customer: Customer) => void;
  onEditProduct?: (prod: Product) => void;
}

export default function POSRegister({
  products,
  customers,
  onAddInvoice,
  onUpdateStocksAfterSale,
  onAddDebtTransaction,
  onQuickAddProduct,
  onAddCustomer,
  onEditProduct,
}: POSRegisterProps) {
  // Notification Toast state
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Navigation & Categorization
  const [selectedCategory, setSelectedCategory] = useState<string>('همه');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [overallDiscount, setOverallDiscount] = useState<number>(0);
  
  // Barcode quick-input simulation
  const [barcodeInput, setBarcodeInput] = useState<string>('');
  const barcodeFieldRef = useRef<HTMLInputElement>(null);

  // Quick custom item adding on-the-fly
  const [showCustomItemModal, setShowCustomItemModal] = useState<boolean>(false);
  const [customItemName, setCustomItemName] = useState<string>('');
  const [customItemPrice, setCustomItemPrice] = useState<string>('');
  const [customItemCategory, setCustomItemCategory] = useState<string>('متفرقه');
  const [customItemUnit, setCustomItemUnit] = useState<string>('عدد');

  // Checkout modal state
  const [showCheckoutModal, setShowCheckoutModal] = useState<boolean>(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<PaymentMethod>('CARD');
  const [checkoutCustomer, setCheckoutCustomer] = useState<string>('CASH_CUSTOMER'); // "CASH_CUSTOMER" or customer id
  const [newCustomerName, setNewCustomerName] = useState<string>('');
  const [newCustomerPhone, setNewCustomerPhone] = useState<string>('');
  const [showNewCustomerInputs, setShowNewCustomerInputs] = useState<boolean>(false);
  const [checkoutNotes, setCheckoutNotes] = useState<string>('');
  const [mergeWithPreviousDebt, setMergeWithPreviousDebt] = useState<boolean>(false);
  const [repayDebtAmount, setRepayDebtAmount] = useState<string>('');

  // Auto-focus barcode input on load
  useEffect(() => {
    focusBarcodeField();
  }, []);

  const focusBarcodeField = () => {
    if (barcodeFieldRef.current) {
      barcodeFieldRef.current.focus();
    }
  };

  // Sound play wrapper
  const handleAddProductToCart = (prod: Product) => {
    // Check if product is expired
    if (prod.expiryDate) {
      const status = checkExpiryState(prod.expiryDate);
      if (status.expired) {
        playErrorBeep();
        const proceed = window.confirm(
          `🚨 هشدار انقضای کالا!\nکالای "${prod.name}" منقضی شده است (${prod.expiryDate}).\nآیا با وجود انقضا، مایلید این کالای منقضی را به فاکتور فروش اضافه کنید؟`
        );
        if (!proceed) {
          focusBarcodeField();
          return;
        }
      }
    }

    playScanBeep();
    setCart((prevCart) => {
      const existing = prevCart.find((item) => item.product.id === prod.id);
      if (existing) {
        return prevCart.map((item) =>
          item.product.id === prod.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevCart, { product: prod, quantity: 1, discount: 0 }];
      }
    });
    focusBarcodeField();
  };

  // Intercept Form Submit on the barcode field to mimic barcode scan trigger
  const handleBarcodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanInput = normalizeBarcode(barcodeInput);
    if (!cleanInput) return;

    const matchedProd = products.find(
      (p) => normalizeBarcode(p.id).toLowerCase() === cleanInput.toLowerCase()
    );

    if (matchedProd) {
      handleAddProductToCart(matchedProd);
      showToast(`کالای "${matchedProd.name}" با موفقیت به فاکتور فروش الحاق شد.`, 'success');
      setBarcodeInput('');
    } else {
      // Beep scan/match helper
      playScanBeep();
      
      const newBarcode = cleanInput;
      const newProd: Product = {
        id: newBarcode,
        name: `کالای جدید بارکدی ${newBarcode}`,
        category: 'متفرقه',
        buyPrice: 0,
        sellPrice: 10000, // editable directly in the list
        stock: 100,
        minStock: 5,
        unit: 'عدد',
      };
      
      // Auto-register without questions
      onQuickAddProduct(newProd);

      // Add straight to cart
      handleAddProductToCart(newProd);
      
      showToast(`🟢 کدهای بارکد ${newBarcode} فوراً ثبت گشت. می‌توانید نام و قیمت را در فاکتور جاری تغییر دهید.`, 'info');
      setBarcodeInput('');
    }
  };

  const handleUpdateCartItemName = (productId: string, newName: string) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, product: { ...item.product, name: newName } }
          : item
      )
    );
    
    const prod = products.find(p => p.id === productId);
    if (prod && onEditProduct) {
      onEditProduct({ ...prod, name: newName });
    }
  };

  const handleUpdateCartItemPrice = (productId: string, newPrice: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId
          ? { ...item, product: { ...item.product, sellPrice: newPrice } }
          : item
      )
    );
    
    const prod = products.find(p => p.id === productId);
    if (prod && onEditProduct) {
      onEditProduct({ ...prod, sellPrice: newPrice });
    }
  };

  // Multipliers & removals of cart rows
  const handleUpdateCartQuantity = (productId: string, newQty: number) => {
    if (newQty <= 0) {
      setCart((prev) => prev.filter((item) => item.product.id !== productId));
    } else {
      setCart((prev) =>
        prev.map((item) =>
          item.product.id === productId ? { ...item, quantity: newQty } : item
        )
      );
    }
  };

  const handleUpdateCartDiscount = (productId: string, discountValue: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.product.id === productId ? { ...item, discount: Math.max(0, discountValue) } : item
      )
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
  };

  const handleAddCustomItemToCart = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(customItemPrice.replace(/,/g, ''));
    if (!customItemName.trim() || isNaN(priceNum) || priceNum <= 0) {
      playErrorBeep();
      alert('لطفا نام محصول و قیمت معتبر وارد کنید.');
      return;
    }

    // Prepare dynamic product
    const mockBarcode = barcodeInput.trim() || Math.floor(100000 + Math.random() * 900000).toString();
    const newProd: Product = {
      id: mockBarcode,
      name: customItemName.trim(),
      category: customItemCategory,
      buyPrice: Math.floor(priceNum * 0.8), // estimated cost
      sellPrice: priceNum,
      stock: 50, // default dummy stock
      minStock: 5,
      unit: customItemUnit,
    };

    // Add to main memory database so it persists
    onQuickAddProduct(newProd);

    // Add to current cashier carts
    handleAddProductToCart(newProd);

    // reset states
    setCustomItemName('');
    setCustomItemPrice('');
    setBarcodeInput('');
    setShowCustomItemModal(false);
  };

  // Calculations
  const cartSubtotal = cart.reduce((sum, item) => sum + Math.round(item.product.sellPrice * item.quantity), 0);
  const cartLineDiscounts = cart.reduce((sum, item) => sum + Math.round(item.discount * item.quantity), 0);
  const payableAmount = Math.max(0, cartSubtotal - cartLineDiscounts - overallDiscount);

  // Search filter options
  const filteredProducts = products.filter((prod) => {
    const matchesCategory = selectedCategory === 'همه' || prod.category === selectedCategory;
    const matchesSearch = prod.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          prod.id.includes(searchQuery);
    return matchesCategory && matchesSearch;
  });

  // Handle Checkout actions
  const handleCheckoutOpen = () => {
    if (cart.length === 0) {
      playErrorBeep();
      return;
    }
    setMergeWithPreviousDebt(false);
    setRepayDebtAmount('');
    setShowCheckoutModal(true);
  };

  const handleProcessCheckout = () => {
    // 1. If physical debt is chosen but no client selected, show error
    if (selectedPaymentMethod === 'DEBT' && checkoutCustomer === 'CASH_CUSTOMER') {
      playErrorBeep();
      alert('بخش نسیه نیازمند انتخاب پرونده یا اضافه نمودن یک حساب کاربری مشتری معتبر است.');
      return;
    }

    // Check if the selected customer has previous debt (بدهی قبلی) to show a warning alert
    if (checkoutCustomer !== 'CASH_CUSTOMER' && !showNewCustomerInputs) {
      const matchCust = customers.find((c) => c.id === checkoutCustomer);
      if (matchCust) {
        const balance = matchCust.transactions.reduce((sum, tx) => {
          if (tx.type === 'DEBT') return sum + tx.amount;
          return sum - tx.amount;
        }, 0);
        if (balance > 0) {
          playErrorBeep();
          const proceed = window.confirm(
            `⚠️ هشدار بدهی قبلی مشتری!\nخریدار محترم "${matchCust.name}" دارای بدهی قبلی به مبلغ ${balance.toLocaleString('fa-IR')} تومان می‌باشد.\nآیا با وجود بدهی قبلی، مایل به تایید و پرداخت این فاکتور هستید؟`
          );
          if (!proceed) return;
        }
      }
    }

    // 2. Add dynamic new client registry if inputs are filled
    let customerName = 'مشتری حضوری';
    let customerPhone = '';
    let targetCustomerId = '';

    if (showNewCustomerInputs && newCustomerName.trim()) {
      const newCustomerId = 'C-' + Math.floor(100 + Math.random() * 900);
      const newCust: Customer = {
        id: newCustomerId,
        name: newCustomerName.trim(),
        phone: newCustomerPhone.trim(),
        transactions: [],
      };
      onAddCustomer(newCust);
      customerName = newCust.name;
      customerPhone = newCust.phone;
      targetCustomerId = newCust.id;
    } else if (checkoutCustomer !== 'CASH_CUSTOMER') {
      const matchCust = customers.find((c) => c.id === checkoutCustomer);
      if (matchCust) {
        customerName = matchCust.name;
        customerPhone = matchCust.phone;
        targetCustomerId = matchCust.id;
      }
    }

    // 3. Formulate the official Invoice structure
    const invoiceId = 'INV-' + Math.floor(1000 + Math.random() * 9000);
    const newInvoice: Invoice = {
      id: invoiceId,
      customerName,
      customerPhone,
      items: cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        sellPrice: item.product.sellPrice,
        buyPrice: item.product.buyPrice,
        discount: item.discount,
        total: Math.round((item.product.sellPrice - item.discount) * item.quantity),
      })),
      subtotal: cartSubtotal,
      discount: overallDiscount + cartLineDiscounts,
      totalBill: payableAmount,
      paymentMethod: selectedPaymentMethod,
      date: new Date().toISOString(),
      cashierName: 'صندوق ۱',
      notes: checkoutNotes.trim() || undefined,
    };

    // 4. Save Invoice & decrease Warehouse Stock counts
    onAddInvoice(newInvoice);
    onUpdateStocksAfterSale(cart);

    // 5. If DEBT method, log Transaction to customer debt list
    if (selectedPaymentMethod === 'DEBT' && targetCustomerId) {
      let debtDesc = '';
      if (mergeWithPreviousDebt) {
        const matchC = customers.find(c => c.id === targetCustomerId);
        const prevDebt = matchC ? matchC.transactions.reduce((sum, tx) => {
          if (tx.type === 'DEBT') return sum + tx.amount;
          return sum - tx.amount;
        }, 0) : 0;
        debtDesc = `ثبت خرید فاکتور ${invoiceId} به مبلغ ${payableAmount.toLocaleString('fa-IR')} تومان (ادغام با بدهی قبلی ${prevDebt.toLocaleString('fa-IR')} ت، مجموع بدهی نهایی: ${(prevDebt + payableAmount).toLocaleString('fa-IR')} ت)${checkoutNotes.trim() ? ` - یادداشت: ${checkoutNotes.trim()}` : ''}`;
      } else {
        debtDesc = checkoutNotes.trim()
          ? `خرید اقلام فاکتور ${invoiceId} به صورت نسیه (یادداشت ثبت شده: ${checkoutNotes.trim()})`
          : `خرید اقلام فاکتور ${invoiceId} به مبلغ ${payableAmount.toLocaleString('fa-IR')} تومان به صورت نسیه`;
      }
      onAddDebtTransaction(
        targetCustomerId,
        payableAmount,
        debtDesc
      );
    }

    // 5.5 If repayment of previous debt is entered, log Transaction as PAYMENT
    const repayVal = parseInt(repayDebtAmount);
    if (targetCustomerId && !isNaN(repayVal) && repayVal > 0) {
      onAddDebtTransaction(
        targetCustomerId,
        repayVal,
        `وصول و تسویه بخشی از بدهی دفتری با مبلغ ${repayVal.toLocaleString('fa-IR')} تومان همزمان با صدور فاکتور ${invoiceId}`,
        'PAYMENT'
      );
    }

    // 6. Complete sound + UI resets
    playCashRegisterSound();
    setCart([]);
    setOverallDiscount(0);
    setSearchQuery('');
    setBarcodeInput('');
    setShowCheckoutModal(false);
    
    // reset customer subforms
    setNewCustomerName('');
    setNewCustomerPhone('');
    setShowNewCustomerInputs(false);
    setCheckoutCustomer('CASH_CUSTOMER');
    setCheckoutNotes('');
    setRepayDebtAmount('');

    // Notify user of completion
    showToast(`حواله فروش فاکتور ${invoiceId} با موفقیت صادر شد!`, 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 h-full font-sans text-right select-none relative" dir="rtl">
      
      {/* Floating Toast Notification */}
      {toast && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 z-[9999] px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 border text-xs font-black transition-all duration-300 ${
          toast.type === 'success' ? 'bg-emerald-900 border-emerald-700 text-emerald-100' : 
          toast.type === 'info' ? 'bg-slate-900 border-blue-800 text-blue-105' : 
          'bg-rose-900 border-rose-700 text-rose-100'
        }`}>
          <span className={`w-2.5 h-2.5 rounded-full animate-pulse ${
            toast.type === 'success' ? 'bg-emerald-400' :
            toast.type === 'info' ? 'bg-sky-400' : 'bg-red-400'
          }`}></span>
          <span>{toast.message}</span>
        </div>
      )}
      
      {/* LEFT AREA: Product Grid & Category Tabs (8/12 widths) */}
      <div className="lg:col-span-8 flex flex-col gap-3 h-full">
        
        {/* FAST-BARCODE & TEXT SEARCH BOX */}
        <div className="bg-white p-3.5 rounded-xl shadow-xs border border-slate-200 flex flex-col md:flex-row gap-3 items-center">
          
          {/* Action Barcode Scanner Input */}
          <form onSubmit={handleBarcodeSubmit} className="w-full md:w-1/2 relative">
            <input
              type="text"
              id="pos-barcode-input"
              ref={barcodeFieldRef}
              placeholder="کد یا اسکن بارکدخوان (F1)..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              className="w-full pl-4 pr-9 py-2 bg-slate-50 border border-slate-200 focus:bg-white focus:ring-2 focus:ring-blue-500 rounded-lg outline-none text-right font-mono font-medium text-xs tracking-wider transition-all placeholder:font-sans"
            />
            <div className="absolute right-3.5 top-2.5 text-slate-400">
              <span className="inline-block w-2 h-2 rounded-full bg-green-500 animate-pulse ml-1.5" title="اتصال بارکدخوان برقرار است"></span>
            </div>
            <button type="submit" className="hidden">ثبت اسکنر</button>
            <div className="text-[9.5px] text-slate-400 mr-1 mt-1 font-sans">
              🟢 اتصال فیزیکی بارکدخوان برقرار است؛ کافیست محصول را اسکن کنید.
            </div>
          </form>

          {/* Regular Search Name Input */}
          <div className="w-full md:w-1/2 relative">
            <input
              type="text"
              id="pos-search-input"
              placeholder="جستجو بر اساس نام یا کد کالا..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-4 pr-9 py-2 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 rounded-lg outline-none text-xs font-medium transition-all"
            />
            <div className="absolute right-3.5 top-2.5 text-slate-400">
              <Search className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* CATEGORY SELECTOR CAROUSEL TABS */}
        <div className="flex gap-1.5 pb-1 overflow-x-auto no-scrollbar scroll-smooth">
          <button
            id="cat-tab-all"
            onClick={() => setSelectedCategory('همه')}
            className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
              selectedCategory === 'همه'
                ? 'bg-blue-600 text-white shadow-xs scale-102 font-black'
                : 'bg-white text-slate-655 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            همه دسته‌ها
          </button>
          {CATEGORIES.map((cat, idx) => (
            <button
              key={idx}
              id={`cat-tab-${idx}`}
              onClick={() => setSelectedCategory(cat)}
              className={`px-5 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all duration-150 cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs scale-102 font-black'
                  : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
              }`}
            >
              {cat}
            </button>
          ))}
          
          <button
            id="btn-quick-custom-item"
            onClick={() => setShowCustomItemModal(true)}
            className="px-4 py-2 text-xs font-bold bg-white text-teal-600 hover:bg-teal-50 border border-teal-200 rounded-full whitespace-nowrap transition-all cursor-pointer flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            کالای سریع (وزنی/متفرقه)
          </button>
        </div>

        {/* GRID OF PRODUCTS */}
        <div className="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 max-h-[500px] pr-0.5" id="pos-product-grid">
          {filteredProducts.length === 0 ? (
            <div className="col-span-full bg-white rounded-xl p-10 border border-dashed border-slate-200 text-center flex flex-col items-center justify-center gap-2">
              <ShoppingCart className="w-10 h-10 text-slate-300" />
              <p className="text-slate-500 font-medium text-xs mt-2 font-sans">هیچ کالایی متناسب با شرایط یافت نشد.</p>
              <button 
                onClick={() => { setSearchQuery(''); setSelectedCategory('همه'); }} 
                className="text-xs font-bold text-blue-650 underline hover:text-blue-800 mt-1 cursor-pointer font-sans"
              >
                پاک کردن فیلترها
              </button>
            </div>
          ) : (
            filteredProducts.map((prod) => {
              const isLowStock = prod.stock <= prod.minStock;
              const emojiMap: Record<string, string> = {
                'لبنیات و صبحانه': '🧀',
                'نوشیدنی‌ها': '🥤',
                'تنقلات و شیرینی': '🍫',
                'شوینده و بهداشتی': '🧼',
                'پروتئین و گوشت': '🍗',
                'کالای اساسی': '🥫',
                'متفرقه': '📦'
              };
              const emoji = emojiMap[prod.category] || '📦';

              return (
                <div
                  key={prod.id}
                  id={`product-card-${prod.id}`}
                  onClick={() => handleAddProductToCart(prod)}
                  className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 hover:border-blue-400 transition-colors cursor-pointer group text-right shadow-xs relative"
                >
                  <div className={`aspect-square bg-slate-50 dark:bg-slate-800 overflow-hidden rounded-lg flex items-center justify-center relative ${prod.stock === 0 ? 'grayscale' : ''}`}>
                    {prod.imageUrl ? (
                      <img
                        src={prod.imageUrl}
                        alt={prod.name}
                        referrerPolicy="no-referrer"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    ) : (
                      <span className="text-2xl opacity-40 group-hover:scale-110 transition-transform duration-200">{emoji}</span>
                    )}
                    {prod.stock === 0 ? (
                      <span className="absolute inset-0 bg-black/40 flex items-center justify-center font-bold text-[10px] text-white rotate-12">عدم موجودی</span>
                    ) : isLowStock ? (
                      <span className="absolute top-1 left-1 bg-amber-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm">کمبود</span>
                    ) : (
                      <span className="absolute top-1 left-1 bg-emerald-500 text-white text-[9px] px-1.5 py-0.5 rounded font-bold shadow-sm">موجود</span>
                    )}
                  </div>

                  <div className="flex-1">
                    <h3 className="text-xs font-bold text-slate-700 leading-tight line-clamp-2 h-8">{prod.name}</h3>
                    <p className="text-[10px] text-slate-400 mt-1">{prod.category}</p>
                    {prod.expiryDate && (() => {
                      const status = checkExpiryState(prod.expiryDate);
                      return (
                        <div className={`text-[9.5px] font-black leading-tight mt-1.5 px-1.5 py-0.5 rounded inline-block ${
                          status.expired 
                            ? 'bg-rose-50 text-rose-700 border border-rose-100' 
                            : status.nearExpiry 
                              ? 'bg-amber-50 text-amber-700 border border-amber-100' 
                              : 'bg-slate-50 text-slate-500 border border-slate-100'
                        }`}>
                          انقضا: {prod.expiryDate}
                        </div>
                      );
                    })()}
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-slate-50">
                    <div className="text-emerald-800 dark:text-emerald-400 font-extrabold text-base md:text-lg lg:text-xl font-mono">
                      {prod.sellPrice.toLocaleString('fa-IR')} <span className="font-sans font-black text-[11px] text-emerald-600 dark:text-emerald-500">تومان</span>
                    </div>
                    <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-750 group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-150">
                      <Plus className="w-3.5 h-3.5" />
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

      </div>

      {/* RIGHT AREA: Interactive Checkout Cart Terminal (4/12 widths) */}
      <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full max-h-[610px]">
        
        {/* Terminal Header */}
        <div className="p-4 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center shrink-0">
          <h2 className="text-xs font-bold flex items-center gap-1.5 text-slate-800">
            <span className="w-1.5 h-4 bg-blue-600 rounded-sm"></span>
            فاکتور فروش جاری
          </h2>
          <button 
            onClick={() => { setCart([]); playErrorBeep(); }} 
            className="text-[10px] bg-white border border-slate-200 px-2.5 py-1 rounded-md text-red-500 font-bold hover:bg-red-50 cursor-pointer transition-all"
          >
            تخلیه سبد
          </button>
        </div>

        {/* CART ROWS list */}
        <div className="flex-1 overflow-y-auto px-1 max-h-[340px]" id="pos-cart-list">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-3 p-10 text-center opacity-70">
              <ShoppingCart className="w-10 h-10 text-slate-300" />
              <p className="text-slate-700 font-bold text-xs">سبد خرید صندوق خالیست</p>
              <p className="text-slate-400 text-[10px] font-sans">برای افزودن، کالاها را بارکد بزنید یا از کاتالوگ چپ کلیک کنید.</p>
            </div>
          ) : (
            <table className="w-full text-right border-collapse">
              <thead className="sticky top-0 bg-white border-b border-slate-100 text-[10px] text-slate-400 z-10">
                <tr>
                  <th className="py-2 px-3 font-medium">شرح کالا</th>
                  <th className="py-2 px-3 font-medium text-center">تعداد</th>
                  <th className="py-2 px-3 font-medium text-left">قیمت</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800 text-xs">
                {cart.map((item) => {
                  const rowSum = Math.round((item.product.sellPrice - item.discount) * item.quantity);
                  const isKiloProduct = item.product.unit === 'کیلوگرم';
                  return (
                    <tr key={item.product.id} className="hover:bg-blue-50/50 dark:hover:bg-slate-800/50 group transition-all">
                      <td className="py-2 px-3 text-right">
                        <input
                          type="text"
                          value={item.product.name}
                          onChange={(e) => handleUpdateCartItemName(item.product.id, e.target.value)}
                          className="font-bold text-slate-800 dark:text-slate-100 text-[11.5px] leading-tight w-full bg-slate-50 dark:bg-slate-800 border-b border-transparent focus:bg-white dark:focus:bg-slate-900 focus:ring-1 focus:ring-blue-300 rounded px-1.5 py-0.5 outline-none transition-all"
                          title="نام کالا (برای تغییر و ویرایش سریع فاکتور کلیک فرمایید)"
                        />
                        <div className="flex flex-wrap items-center gap-1 mt-1 text-[10px] text-slate-500 dark:text-slate-400">
                          <span className="font-mono text-slate-400">کد: {item.product.id}</span>
                          <span className="text-slate-300">•</span>
                          <div className="flex items-center gap-1">
                            <span>فی:</span>
                            <input
                              type="number"
                              value={item.product.sellPrice || 0}
                              onChange={(e) => handleUpdateCartItemPrice(item.product.id, parseInt(e.target.value) || 0)}
                              className="w-[90px] text-left font-mono font-black text-emerald-800 dark:text-emerald-450 text-sm md:text-base bg-slate-50 dark:bg-slate-850 focus:bg-white dark:focus:bg-slate-900 px-1.5 py-0.5 border border-slate-200 dark:border-slate-700 focus:border-emerald-400 rounded outline-none"
                              title="قیمت واحد کالا (قابل ویرایش سریع)"
                            />
                            <span>تومان</span>
                          </div>
                        </div>
                        {/* Inline discount */}
                        <div className="flex items-center gap-1.5 mt-1.5">
                          <Tag className="w-2.5 h-2.5 text-rose-500" />
                          <input
                            type="number"
                            placeholder="تخفیف"
                            value={item.discount || ''}
                            onChange={(e) => handleUpdateCartDiscount(item.product.id, parseInt(e.target.value) || 0)}
                            className="w-14 text-left text-[9.5px] font-bold text-rose-600 bg-rose-50 dark:bg-rose-950/30 focus:bg-white dark:focus:bg-slate-900 pl-1 py-0.5 border border-rose-100 dark:border-rose-900/50 rounded outline-none"
                          />
                        </div>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {isKiloProduct ? (
                          <div className="flex flex-col items-center gap-1">
                            <div className="flex items-center gap-1 justify-center">
                              <input
                                type="number"
                                min="0"
                                step="10"
                                value={Math.round(item.quantity * 1000)}
                                onChange={(e) => {
                                  const grams = parseFloat(e.target.value) || 0;
                                  handleUpdateCartQuantity(item.product.id, grams / 1000);
                                }}
                                className="w-[65px] text-center font-bold font-mono text-xs text-blue-600 dark:text-amber-400 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded p-1 outline-none focus:ring-1 focus:ring-blue-400 focus:bg-white dark:focus:bg-slate-900"
                                placeholder="گرم"
                              />
                              <span className="text-[10px] text-slate-400 dark:text-slate-500">گرم</span>
                            </div>
                            <span className="text-[9px] text-slate-400 dark:text-slate-500 font-sans">
                              ({item.quantity.toLocaleString('fa-IR', { maximumFractionDigits: 3 })} ک.گ)
                            </span>
                          </div>
                        ) : (
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleUpdateCartQuantity(item.product.id, item.quantity - 1)}
                              className="w-5 h-5 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 rounded flex items-center justify-center font-bold text-xs transition-all cursor-pointer leading-none"
                            >
                              -
                            </button>
                            <span className="text-xs font-black text-slate-800 dark:text-slate-200 font-mono w-4 block text-center">
                              {item.quantity.toLocaleString('fa-IR')}
                            </span>
                            <button
                              onClick={() => handleUpdateCartQuantity(item.product.id, item.quantity + 1)}
                              className="w-5 h-5 bg-white dark:bg-slate-800 dark:border-slate-700 dark:text-slate-200 border border-slate-300 hover:border-slate-400 text-slate-700 hover:bg-slate-50 rounded flex items-center justify-center font-bold text-xs transition-all cursor-pointer leading-none"
                            >
                              +
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="py-2 px-3 text-left">
                        <div className="font-extrabold text-slate-900 dark:text-slate-100 font-mono text-sm">{rowSum.toLocaleString('fa-IR')}</div>
                        {item.discount > 0 && (
                          <div className="text-[9px] text-red-500 font-bold font-sans">-{Math.round(item.discount * item.quantity).toLocaleString('fa-IR')} ت</div>
                        )}
                        <button
                          onClick={() => handleRemoveFromCart(item.product.id)}
                          className="mt-1 p-0.5 text-slate-400 hover:text-red-500 rounded hover:bg-red-50 dark:hover:bg-red-950/30 cursor-pointer hidden group-hover:inline-block transition-all"
                          title="حذف ردیف"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Totals & Payment Section */}
        <div className="p-4 border-t border-slate-200 bg-slate-900 text-white rounded-b-xl">
          <div className="flex justify-between items-center text-xs opacity-60 mb-2 font-mono">
            <span>جمع کل اقلام فاکتور:</span>
            <span>{cartSubtotal.toLocaleString('fa-IR')} تومان</span>
          </div>
          {cartLineDiscounts > 0 && (
            <div className="flex justify-between items-center text-xs text-red-400 mb-2 font-mono">
              <span>تخفیف تک‌ردیف‌ها:</span>
              <span>-{cartLineDiscounts.toLocaleString('fa-IR')} تومان</span>
            </div>
          )}

          {/* OVERALL DISCOUNT INPUT */}
          <div className="flex justify-between items-center mb-3 text-xs">
            <span className="opacity-60 font-sans">تخفیف کلی فاکتور (تومان):</span>
            <input
              type="number"
              placeholder="تخفیف کسر نهایی"
              value={overallDiscount || ''}
              onChange={(e) => setOverallDiscount(parseInt(e.target.value) || 0)}
              className="w-24 text-left font-bold text-red-400 bg-white/10 hover:bg-white/15 focus:bg-white focus:text-slate-900 px-2 py-0.5 rounded border border-white/10 outline-none text-[11px]"
            />
          </div>

          <div className="flex justify-between items-end mt-4 pt-4 border-t border-slate-700 font-mono">
            <span className="text-sm font-black font-sans text-slate-100">مبلغ نهایی قابل پرداخت:</span>
            <div className="text-right">
              <div className="text-3xl md:text-4xl font-extrabold text-green-400 tracking-tight">{payableAmount.toLocaleString('fa-IR')}</div>
              <div className="text-xs opacity-80 text-slate-300 font-sans">تومان (ریال معادل { (payableAmount * 10).toLocaleString('fa-IR') })</div>
            </div>
          </div>

          {/* CHECKOUT MASTER TRIGGER BUTTON */}
          <div className="grid grid-cols-1 gap-2 mt-5">
            <button
              onClick={handleCheckoutOpen}
              disabled={cart.length === 0}
              className={`w-full py-3 rounded-lg font-bold transition-all text-xs text-center text-white flex items-center justify-center gap-2 shadow-lg ${
                cart.length === 0
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                  : 'bg-green-600 hover:bg-green-500 cursor-pointer active:scale-98 border-b-2 border-green-800'
              }`}
            >
              <PackageCheck className="w-4 h-4 text-white" />
              <span>پرداخت و صدور فیش خرید (F2)</span>
            </button>
          </div>
        </div>

      </div>

      {/* MODAL 1: Checkout Details (Payment type, Customer assigning, etc) */}
      {showCheckoutModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col p-6 animate-fade-in text-right">
            
            <h3 className="font-bold text-slate-800 border-b border-slate-100 pb-3 text-center text-sm md:text-base flex items-center justify-center gap-2">
              <CreditCard className="w-5 h-5 text-blue-600" />
              تکمیل و تسویه فاکتور فروش
            </h3>

            <div className="my-5 flex justify-between items-center bg-blue-50 text-blue-800 p-4 rounded-lg font-bold font-mono text-sm border border-blue-100">
              <span className="font-sans">مبلغ نهایی قابل تسویه:</span>
              <span className="text-blue-700 text-base">{payableAmount.toLocaleString('fa-IR')} تومان</span>
            </div>

            {/* PAYMENT TYPES SELECTOR */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-600 block">انتخاب روش تسویه و دریافت وجه:</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { mode: 'CARD' as PaymentMethod, label: '💳 کارتخوان', color: 'border-slate-200 hover:bg-slate-50 text-slate-700' },
                  { mode: 'CASH' as PaymentMethod, label: '💵 نقدی صندق', color: 'border-slate-200 hover:bg-slate-50 text-slate-700' },
                  { mode: 'DEBT' as PaymentMethod, label: '📓 نسیه‌ دفتری', color: 'border-slate-200 hover:bg-slate-50 text-slate-700' },
                ].map((pay) => {
                  const isChosen = selectedPaymentMethod === pay.mode;
                  return (
                    <button
                      key={pay.mode}
                      onClick={() => setSelectedPaymentMethod(pay.mode)}
                      className={`p-2.5 rounded-lg border text-xs font-bold text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                        isChosen 
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs' 
                          : pay.color
                      }`}
                    >
                      {pay.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* CUSTOMER PROFILE ASSIGNER */}
            <div className="mt-4 space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs font-bold text-slate-600">انتخاب پرونده مشتری (خریدار):</label>
                <button
                  onClick={() => setShowNewCustomerInputs(!showNewCustomerInputs)}
                  className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
                >
                  {showNewCustomerInputs ? 'بازگشت به لیست خریداران' : '+ افزودن مشتری جدید'}
                </button>
              </div>

              {!showNewCustomerInputs ? (
                <select
                  value={checkoutCustomer}
                  onChange={(e) => {
                    setCheckoutCustomer(e.target.value);
                    setMergeWithPreviousDebt(false);
                  }}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs font-medium cursor-pointer"
                >
                  <option value="CASH_CUSTOMER">مشتری حضوری و متفرقه</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} {c.phone ? `(${c.phone})` : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="bg-blue-50/30 p-3 rounded-lg border border-blue-100 space-y-2">
                  <input
                    type="text"
                    required
                    placeholder="نام و فامیل مشتری (مثلاً: مهندس قادری)"
                    value={newCustomerName}
                    onChange={(e) => setNewCustomerName(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="tel"
                    placeholder="شماره تماس معتبر (اختیاری)"
                    value={newCustomerPhone}
                    onChange={(e) => setNewCustomerPhone(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-blue-500 rounded-lg text-xs outline-none font-mono text-left"
                  />
                </div>
              )}
            </div>

            {/* REAL-TIME CUSTOMER PREVIOUS DEBT DETECTOR CARD */}
            {!showNewCustomerInputs && checkoutCustomer !== 'CASH_CUSTOMER' && (() => {
              const selectedCustomerObj = customers.find(c => c.id === checkoutCustomer);
              if (!selectedCustomerObj) return null;
              const prevDebt = selectedCustomerObj.transactions.reduce((sum, tx) => {
                if (tx.type === 'DEBT') return sum + tx.amount;
                return sum - tx.amount;
              }, 0);
              
              if (prevDebt <= 0) return null;
              return (
                <div className="mt-4 p-5 bg-amber-50/90 border-2 border-amber-400 dark:bg-amber-950/30 dark:border-amber-800 rounded-xl space-y-4 shadow-sm">
                  <div className="flex gap-2.5 items-start text-right leading-relaxed">
                    <AlertCircle className="w-5.5 h-5.5 shrink-0 text-amber-600 mt-1 animate-pulse" />
                    <div>
                      <h4 className="font-black text-amber-950 dark:text-amber-200 text-sm md:text-base">⚠️ هشدار حساب بدهکار فعال</h4>
                      <p className="mt-1.5 font-bold text-amber-800 dark:text-amber-400 leading-relaxed text-xs md:text-sm">
                        مشتری محترم جناب <span className="underline font-black text-amber-950 dark:text-amber-100">{selectedCustomerObj.name}</span> دارای بدهی دفتری قبلی به میزان <span className="inline-block mt-0.5 font-mono text-sm md:text-base text-red-800 dark:text-red-300 bg-red-100 dark:bg-red-950/60 px-2.5 py-1 rounded-lg border border-red-300 dark:border-red-800 font-black">{prevDebt.toLocaleString('fa-IR')} تومان</span> می‌باشد.
                      </p>
                    </div>
                  </div>

                  {/* Toggle checkbox to calculate and merge new invoice with previous debt */}
                  <div className="pt-4 border-t border-amber-250 dark:border-amber-900/40 flex flex-col gap-3">
                    <label className="flex items-center gap-2.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={mergeWithPreviousDebt}
                        onChange={(e) => {
                          setMergeWithPreviousDebt(e.target.checked);
                          if (e.target.checked) {
                            setSelectedPaymentMethod('DEBT');
                          }
                        }}
                        className="w-5 h-5 text-amber-600 border-amber-400 rounded focus:ring-amber-500 cursor-pointer accent-amber-600"
                      />
                      <span className="font-extrabold text-amber-950 dark:text-amber-100 text-xs md:text-sm">
                        🧮 حساب‌کتاب و ادغام فاکتور جدید با بدهی قبلی مشتری
                      </span>
                    </label>

                    {/* Partial Debt Repayment input field */}
                    <div className="mt-3 flex flex-col gap-1.5">
                      <span className="font-black text-amber-950 dark:text-amber-200 text-xs md:text-sm block text-right">
                        💸 دریافت علی‌الحساب بابت تسویه بخشی از بدهی قبلی در این فاکتور (تومان):
                      </span>
                      <div className="relative">
                        <input
                          type="number"
                          placeholder="مثلاً ۵۰۰,۰۰۰"
                          value={repayDebtAmount}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '') {
                              setRepayDebtAmount('');
                            } else {
                              const num = parseInt(val) || 0;
                              if (num >= 0) {
                                setRepayDebtAmount(val);
                              }
                            }
                          }}
                          className="w-full p-3.5 bg-white dark:bg-slate-950 border-2 border-amber-300 focus:border-indigo-500 rounded-xl outline-none text-base md:text-xl lg:text-2xl text-left font-mono font-black text-slate-900 dark:text-white tracking-wider"
                        />
                        {repayDebtAmount && (() => {
                          const parsedRepay = parseInt(repayDebtAmount) || 0;
                          return (
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-xs md:text-sm text-emerald-900 dark:text-emerald-300 font-extrabold font-sans bg-emerald-100 dark:bg-emerald-950 px-2.5 py-1.5 rounded-lg border border-emerald-300">
                              {parsedRepay.toLocaleString('fa-IR')} تومان وصولی
                            </div>
                          );
                        })()}
                      </div>
                    </div>

                    {(() => {
                      const parsedRepay = parseInt(repayDebtAmount) || 0;
                      const finalDebtValue = prevDebt + (mergeWithPreviousDebt ? payableAmount : 0) - parsedRepay;
                      
                      if (mergeWithPreviousDebt || parsedRepay > 0) {
                        return (
                          <div className="mt-3 space-y-3 p-4 bg-white/95 dark:bg-slate-900 border border-amber-300 dark:border-amber-900 rounded-xl font-sans text-xs md:text-sm transition-all animate-fadeIn shadow-sm">
                            <div className="flex justify-between items-center text-slate-600 dark:text-slate-400">
                              <span className="font-bold">مانده بدهی قبلی دفتری:</span>
                              <span className="font-mono font-black text-sm md:text-base text-slate-800 dark:text-slate-200">{prevDebt.toLocaleString('fa-IR')} تومان</span>
                            </div>
                            
                            {mergeWithPreviousDebt && (
                              <div className="flex justify-between items-center text-indigo-805 dark:text-indigo-400 font-extrabold">
                                <span>+ مبلغ فاکتور جدید:</span>
                                <span className="font-mono font-black text-sm md:text-base">+{payableAmount.toLocaleString('fa-IR')} تومان</span>
                              </div>
                            )}

                            {parsedRepay > 0 && (
                              <div className="flex justify-between items-center text-rose-650 dark:text-rose-400 font-extrabold">
                                <span>- مبلغ تسویه/وصولی جدید:</span>
                                <span className="font-mono font-black text-sm md:text-base">-{parsedRepay.toLocaleString('fa-IR')} تومان</span>
                              </div>
                            )}

                            <div className="flex justify-between items-center pt-3 border-t-2 border-dashed border-slate-200 dark:border-slate-800 text-emerald-800 dark:text-emerald-400 font-black">
                              <span className="text-sm md:text-base">{finalDebtValue < 0 ? 'مانده طلبکار (بستانکار) مشتری:' : 'مانده بدهی نهایی دفتری:'}</span>
                              <span className={`font-mono text-lg md:text-xl lg:text-2xl underline decoration-double font-black ${finalDebtValue < 0 ? 'text-blue-600 dark:text-blue-400' : 'text-emerald-900 dark:text-emerald-350 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded'}`}>
                                {Math.abs(finalDebtValue).toLocaleString('fa-IR')} تومان
                              </span>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                </div>
              );
            })()}

            {/* NOTES & MEMO FIELD */}
            <div className="mt-4 space-y-1.5">
              <label className="text-[11px] font-bold text-slate-500 block">
                {selectedPaymentMethod === 'DEBT' ? '📓 یادداشت بابت حساب نسیه (مثلاً اقلام خاص یا زمان تسویه):' : '✍️ یادداشت فاکتور (اختیاری):'}
              </label>
              <textarea
                rows={2}
                value={checkoutNotes}
                onChange={(e) => setCheckoutNotes(e.target.value)}
                placeholder={selectedPaymentMethod === 'DEBT' ? "مثال: تسویه تا آخر برج، بابت خرید عمده روغن و چای..." : "توضیحات کلی فاکتور..."}
                className="w-full p-2 bg-slate-50 border border-slate-200 focus:bg-white focus:border-blue-400 rounded-lg text-xs outline-none transition-all resize-none font-sans"
              />
            </div>

            {/* WARNING BADGES */}
            {selectedPaymentMethod === 'DEBT' && checkoutCustomer === 'CASH_CUSTOMER' && !showNewCustomerInputs && (
              <div className="mt-4 p-3 bg-red-50 text-red-800 rounded-lg border border-red-100 text-xs flex gap-2 items-start leading-tight">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-650 mt-0.5" />
                <p>در حالت پرداخت نسیه، نمی‌توان فاکتور را روی مشتری متفرقه ثبت کرد. لطفا مشتری دفتری انتخاب نموده یا مشتری جدید بسازید.</p>
              </div>
            )}

            {/* CHECKOUT SUBMISSION ACTIONS */}
            <div className="mt-6 flex gap-3 pt-3 border-t border-slate-100">
              <button
                onClick={() => setShowCheckoutModal(false)}
                className="w-1/3 py-2.5 border border-slate-200 hover:bg-slate-50 rounded-lg font-bold text-xs text-slate-500 cursor-pointer transition-all text-center"
              >
                انصراف
              </button>
              
              <button
                onClick={handleProcessCheckout}
                disabled={selectedPaymentMethod === 'DEBT' && checkoutCustomer === 'CASH_CUSTOMER' && !showNewCustomerInputs}
                className={`w-2/3 py-2.5 rounded-lg font-bold text-xs text-center text-white transition-all cursor-pointer ${
                  selectedPaymentMethod === 'DEBT' && checkoutCustomer === 'CASH_CUSTOMER' && !showNewCustomerInputs
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : 'bg-blue-600 hover:bg-blue-500 shadow-sm active:scale-99'
                }`}
              >
                تایید تسویه و صدور فیش خرید
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL 2: Quick Register New Product popup */}
      {showCustomItemModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddCustomItemToCart} className="bg-white rounded-xl w-full max-w-sm shadow-2xl p-6 text-right">
            
            <h3 className="font-bold text-slate-800 border-b border-slate-105 pb-3 flex items-center justify-start gap-1.5 text-xs md:text-sm">
              <Plus className="w-4.5 h-4.5 text-blue-600" />
              افزودن سریع کالای جدید به سبد
            </h3>

            <div className="my-4 space-y-3 font-sans">
              
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">نام کامل کالا / خدمت:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: سیب درختی قرمز قپان، متفرقه غرفه ۲"
                  value={customItemName}
                  onChange={(e) => setCustomItemName(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 focus:border-blue-500 rounded-lg outline-none text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">قیمت فروش (تومان):</label>
                  <input
                    type="text"
                    required
                    placeholder="۳۵,۰۰۰"
                    value={customItemPrice}
                    onChange={(e) => setCustomItemPrice(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 focus:border-blue-500 rounded-lg outline-none text-xs font-mono text-left"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-500">واحد شمارش کالا:</label>
                  <select
                    value={customItemUnit}
                    onChange={(e) => setCustomItemUnit(e.target.value)}
                    className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs cursor-pointer"
                  >
                    {UNITS.map((u, i) => <option key={i} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500">دسته‌بندی مربوطه:</label>
                <select
                  value={customItemCategory}
                  onChange={(e) => setCustomItemCategory(e.target.value)}
                  className="w-full p-2.5 bg-white border border-slate-200 rounded-lg outline-none text-xs cursor-pointer"
                >
                  {CATEGORIES.map((cat, i) => <option key={i} value={cat}>{cat}</option>)}
                </select>
              </div>

            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowCustomItemModal(false)}
                className="w-1/2 py-2 border border-slate-200 text-slate-500 hover:bg-slate-50 rounded-lg text-xs cursor-pointer text-center"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="w-1/2 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg text-xs cursor-pointer active:scale-98 text-center"
              >
                افزودن به سبد صندوق
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
