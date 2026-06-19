import React from 'react';
import { Product, Invoice, Customer } from '../types';
import { CATEGORIES } from '../sampleData';
import { 
  TrendingUp, 
  DollarSign, 
  Package, 
  Users, 
  UserPlus, 
  FileText, 
  AlertTriangle, 
  Briefcase, 
  Wallet,
  ShoppingBag,
  Clock,
  CheckCircle2
} from 'lucide-react';
import { formatPersianNumber } from './ReceiptModal';

interface FinancialDashboardProps {
  products: Product[];
  invoices: Invoice[];
  customers: Customer[];
}

export default function FinancialDashboard({
  products,
  invoices,
  customers,
}: FinancialDashboardProps) {

  // --- 1. CURRENT INVENTORY CAPITAL METRICS ---
  const totalPurchaseCapitalLocked = products.reduce((sum, p) => sum + (p.buyPrice * p.stock), 0);
  const totalExpectedSalesValue = products.reduce((sum, p) => sum + (p.sellPrice * p.stock), 0);
  const potentialGrossProfit = Math.max(0, totalExpectedSalesValue - totalPurchaseCapitalLocked);

  // --- 2. HISTORICAL SALES REVENUE & NET MARGIN METRICS ---
  const totalSalesRevenue = invoices.reduce((sum, inv) => sum + inv.totalBill, 0);
  
  // Historical NET PROFIT (considers discount on items + historical buy price)
  const totalNetProfitSecured = invoices.reduce((sum, inv) => {
    const invProfit = inv.items.reduce((pSum, item) => {
      // profit on each item = (sellPrice - buyPrice - itemDiscount) * qty
      const unitProfit = item.sellPrice - item.buyPrice - item.discount;
      return pSum + (unitProfit * item.quantity);
    }, 0);
    // deduct overall discount at checkout if any
    const overallInvoiceDiscountPercentage = inv.subtotal > 0 ? (inv.discount / inv.subtotal) : 0;
    const finalProfit = Math.max(0, invProfit - (inv.discount * (invProfit / (inv.subtotal || 1)))); // proportional discount attribution or direct subtraction
    return sum + invProfit; 
  }, 0);

  // --- 3. CUSTOMER LEDGER (DEBTS STATUS) ---
  const totalDebtsReceivables = customers.reduce((sum, cust) => {
    const bal = cust.transactions.reduce((tSum, t) => {
      if (t.type === 'DEBT') return tSum + t.amount;
      return tSum - t.amount;
    }, 0);
    return sum + (bal > 0 ? bal : 0);
  }, 0);

  // --- 4. SALES PAYMENT METHOD RATIO ---
  const payMethodAnalysis = invoices.reduce(
    (acc, inv) => {
      if (inv.paymentMethod === 'CARD') acc.card += inv.totalBill;
      else if (inv.paymentMethod === 'CASH') acc.cash += inv.totalBill;
      else if (inv.paymentMethod === 'DEBT') acc.debt += inv.totalBill;
      return acc;
    },
    { card: 0, cash: 0, debt: 0 }
  );

  const totalCollectedForRatio = payMethodAnalysis.card + payMethodAnalysis.cash + payMethodAnalysis.debt || 1;
  const cardPercent = Math.round((payMethodAnalysis.card / totalCollectedForRatio) * 100);
  const cashPercent = Math.round((payMethodAnalysis.cash / totalCollectedForRatio) * 100);
  const debtPercent = Math.round((payMethodAnalysis.debt / totalCollectedForRatio) * 100);

  // --- 5. CATEGORIES SALES DISTRIBUTION ---
  const categorySalesMap: Record<string, number> = {};
  CATEGORIES.forEach((cat) => {
    categorySalesMap[cat] = 0;
  });

  invoices.forEach((inv) => {
    inv.items.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId || p.name === item.productName);
      const cat = prod?.category || 'متفرقه';
      if (categorySalesMap[cat] !== undefined) {
        categorySalesMap[cat] += item.total;
      } else {
        categorySalesMap['متفرقه'] = (categorySalesMap['متفرقه'] || 0) + item.total;
      }
    });
  });

  const maxCategorySales = Math.max(...Object.values(categorySalesMap), 1);

  // --- 6. CRITICAL LOW STOCK ORDER LIST ---
  const lowStockAlerts = products.filter((p) => p.stock <= p.minStock);

  return (
    <div className="space-y-6 text-right font-sans select-none" dir="rtl">
      
      {/* Title */}
      <div className="bg-white p-4 rounded-2xl border border-gray-100 shadow-xs">
        <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-slate-800" />
          داشبورد هوش مالی و حسابداری سوپرمارکت
        </h2>
        <p className="text-xs text-gray-500 mt-1">بررسی ارزش کالاها، حاشیه سودآوری کل، سهم دریافتی‌های صندوق و وضعیت صندوق نسیه</p>
      </div>

      {/* METRIC CARD GRIDS */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* TOTAL SALES REVENUE */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 block">کل فروش صندوق (درآمد کل)</span>
            <span className="text-lg font-black text-slate-950 font-mono block">
              {totalSalesRevenue.toLocaleString('fa-IR')}
            </span>
            <span className="text-[9.5px] text-gray-500 font-bold block">از {invoices.length.toLocaleString('fa-IR')} فاکتور صادره</span>
          </div>
          <div className="p-3.5 bg-sky-50 rounded-2xl border border-sky-100 text-sky-700">
            <ShoppingBag className="w-6 h-6" />
          </div>
        </div>

        {/* SECURED NET PROFIT */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 block">سود ناخالص کسب‌شده (قدر مابه التفاوت)</span>
            <span className="text-lg font-black text-emerald-800 font-mono block">
              {totalNetProfitSecured.toLocaleString('fa-IR')}
            </span>
            <span className="text-[9.5px] text-emerald-700 font-bold block">
              حاشیه سود مغازه: {totalSalesRevenue > 0 ? Math.round((totalNetProfitSecured / totalSalesRevenue) * 100).toLocaleString('fa-IR') : '۰'}٪
            </span>
          </div>
          <div className="p-3.5 bg-emerald-50 rounded-2xl border border-emerald-100 text-emerald-700">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        {/* LOCKED CAPITAL IN WAREHOUSE */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 block">سرمایه کل درون انبار (ارزش خرید کالا)</span>
            <span className="text-lg font-black text-slate-950 font-mono block">
              {totalPurchaseCapitalLocked.toLocaleString('fa-IR')}
            </span>
            <span className="text-[9.5px] text-gray-500 font-bold block">موجود بر روی طبقات سوپرمارکت</span>
          </div>
          <div className="p-3.5 bg-slate-100 rounded-2xl border border-slate-200 text-slate-800">
            <Package className="w-6 h-6" />
          </div>
        </div>

        {/* ACCOUNTS RECEIVABLES */}
        <div className="bg-white p-5 rounded-2xl border border-gray-150 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-gray-400 block">کل مطالبات وصول‌نشده (نسیه)</span>
            <span className="text-lg font-black text-amber-700 font-mono block">
              {totalDebtsReceivables.toLocaleString('fa-IR')}
            </span>
            <span className="text-[9.5px] text-amber-600 font-bold block">طلب باقی‌مانده در دفتر نسیه محل</span>
          </div>
          <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-100 text-amber-700">
            <Wallet className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* CHARTS CONTAINER GRIDS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* CHART 1: SALES BY CATEGORY BAR GRAPHIC (Tailwind pure CSS) */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-4">
          <div>
            <h3 className="font-black text-slate-900 text-xs">سهم دسته‌بندی‌ها از سود و فروش کل فروشگاه</h3>
            <p className="text-[10px] text-gray-400 mt-1">توزیع مبلغی تراکنش‌ها بر اساس گروه‌های هفت‌گانه محصولات</p>
          </div>

          <div className="space-y-3.5 flex-1 flex flex-col justify-center">
            {CATEGORIES.map((cat) => {
              const salesValue = categorySalesMap[cat] || 0;
              const percentOfMax = (salesValue / maxCategorySales) * 100;
              return (
                <div key={cat} className="space-y-1.5">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-gray-700">{cat}</span>
                    <span className="font-mono font-medium text-gray-600">{salesValue.toLocaleString('fa-IR')} تومان</span>
                  </div>
                  <div className="h-2.5 bg-slate-50 border border-gray-200/40 rounded-full overflow-hidden relative">
                    <div 
                      style={{ width: `${Math.max(3, percentOfMax)}%` }}
                      className="absolute inset-y-0 right-0 h-full bg-gradient-to-l from-slate-900 to-slate-700 rounded-full transition-all duration-300"
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* CHART 2: CARD VS CASH VS DEBT SPLITS CIRCULAR AND BARS */}
        <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs flex flex-col gap-5">
          <div>
            <h3 className="font-black text-slate-900 text-xs">دریافتی‌های مالی صندوق تفکیک شده</h3>
            <p className="text-[10px] text-gray-400 mt-1">تناسب شیوه‌های تسویه مشتریان در خریدهای جاری</p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center gap-6">
            
            {/* Visual ratio blocks */}
            <div className="w-full grid grid-cols-3 gap-3 text-center">
              {[
                { label: '💳 کارتخوان', value: payMethodAnalysis.card, color: 'bg-blue-600', percent: cardPercent },
                { label: '💵 نقدی', value: payMethodAnalysis.cash, color: 'bg-emerald-600', percent: cashPercent },
                { label: '📓 نسیه دفتری', value: payMethodAnalysis.debt, color: 'bg-amber-600', percent: debtPercent },
              ].map((pm, i) => (
                <div key={i} className="p-3 bg-gray-50 border border-gray-100 rounded-xl space-y-1 font-mono">
                  <span className="text-[10.5px] font-sans font-bold text-gray-500 block">{pm.label}</span>
                  <span className="text-xs font-black text-slate-900 block mt-1">{pm.value.toLocaleString('fa-IR')} ت</span>
                  <span className="text-[10px] text-gray-450 block font-sans">({pm.percent.toLocaleString('fa-IR')}٪ سهم)</span>
                </div>
              ))}
            </div>

            {/* Split composite bar */}
            <div className="w-full h-4 bg-gray-150 rounded-full overflow-hidden flex select-none">
              <div style={{ width: `${cardPercent}%` }} className="bg-blue-600 h-full cursor-pointer" title={`کارتخوان: ${cardPercent}%`}></div>
              <div style={{ width: `${cashPercent}%` }} className="bg-emerald-600 h-full cursor-pointer" title={`نقدی: ${cashPercent}%`}></div>
              <div style={{ width: `${debtPercent}%` }} className="bg-amber-600 h-full cursor-pointer" title={`نسیه: ${debtPercent}%`}></div>
            </div>

            <div className="flex items-center gap-4 text-[10px] text-gray-450 select-none">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>کارتخوان</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>نقدی صندق</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-600"></span>نسیه دفتری</span>
            </div>

          </div>
        </div>

      </div>

      {/* RESTOCKING ORDER WARNING BLOCK */}
      <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-gray-100 pb-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4.5 h-4.5 text-amber-500 animate-pulse" />
            <h3 className="font-black text-slate-950 text-xs">کالاهای رو به اتمام (لیست خرید سفارش جدید)</h3>
          </div>
          <span className="text-[10.5px] px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-bold font-mono">
            {lowStockAlerts.length.toLocaleString('fa-IR')} کالا نیاز به شارژ دارد
          </span>
        </div>

        {lowStockAlerts.length === 0 ? (
          <div className="p-8 text-center text-gray-400 text-xs flex flex-col items-center justify-center gap-1 select-none font-sans">
            <CheckCircle2 className="w-7 h-7 text-emerald-500 mb-1" />
            موجودی کل قفسه‌های انبار کالاها بالاتر از حداقل حد نصاب مجاز است. فوق‌العاده است!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3" id="low-stocks-warning-grid">
            {lowStockAlerts.map((prod) => (
              <div key={prod.id} className="p-3 bg-red-50/25 hover:bg-amber-50/20 rounded-xl border border-rose-100 flex justify-between items-center text-xs">
                <div>
                  <span className="font-bold text-gray-800 block line-clamp-1">{prod.name}</span>
                  <span className="text-[10px] text-gray-400 font-mono block mt-1">بارکد: {prod.id} | گروه: {prod.category}</span>
                </div>
                
                <div className="text-left font-mono shrink-0 pl-1">
                  <span className="text-rose-700 font-black block">
                    {prod.stock.toLocaleString('fa-IR')} {prod.unit}
                  </span>
                  <span className="text-[9px] text-gray-400 block mt-0.5">حداقل مجاز: {prod.minStock.toLocaleString('fa-IR')}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
