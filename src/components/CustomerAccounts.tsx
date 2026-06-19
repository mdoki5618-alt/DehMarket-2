import React, { useState } from 'react';
import { Customer, DebtTransaction } from '../types';
import { formatPersianNumber, formatPersianDate } from './ReceiptModal';
import { Plus, Search, User, CreditCard, BookOpen, AlertCircle, Trash2, ArrowUpRight, ArrowDownLeft, Trash } from 'lucide-react';

interface CustomerAccountsProps {
  customers: Customer[];
  onAddCustomer: (customer: Customer) => void;
  onAddDebtTransaction: (customerId: string, amount: number, desc: string, type?: 'DEBT' | 'PAYMENT') => void;
  onClearCustomerTransactions: (customerId: string) => void;
}

export default function CustomerAccounts({
  customers,
  onAddCustomer,
  onAddDebtTransaction,
  onClearCustomerTransactions,
}: CustomerAccountsProps) {
  const [search, setSearch] = useState('');
  
  // Selected customer folder detail
  const [activeCustomerId, setActiveCustomerId] = useState<string | null>(null);

  // New Client creation trigger
  const [showAddModal, setShowAddModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');

  // Settle Debt Action Trigger
  const [showSettleModal, setShowSettleModal] = useState(false);
  const [settleAmount, setSettleAmount] = useState<number>(0);
  const [settleDesc, setSettleDesc] = useState('وصول و تسویه بخشی از بدهی دفتری');

  const filteredCustomers = customers.filter((cust) => {
    return cust.name.toLowerCase().includes(search.toLowerCase()) || cust.phone.includes(search);
  });

  const activeCustomer = customers.find((c) => c.id === activeCustomerId);

  // Calculate high-level customer ledger details
  const getCustomerBalance = (cust: Customer) => {
    return cust.transactions.reduce((sum, tx) => {
      if (tx.type === 'DEBT') return sum + tx.amount;
      return sum - tx.amount;
    }, 0);
  };

  const handleAddCustomerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newCust: Customer = {
      id: 'C-' + Math.floor(100 + Math.random() * 900),
      name: newName.trim(),
      phone: newPhone.trim(),
      transactions: [],
    };

    onAddCustomer(newCust);
    setNewName('');
    setNewPhone('');
    setShowAddModal(false);
    setActiveCustomerId(newCust.id); // auto select newly registered folder
  };

  const handleSettleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeCustomerId || settleAmount <= 0) return;

    // Append a PAYMENT (creditor cash-inflow) transaction reduces customer debt!
    onAddDebtTransaction(activeCustomerId, settleAmount, settleDesc, 'PAYMENT');
    setSettleAmount(0);
    setSettleDesc('وصول و تسویه بخشی از بدهی دفتری');
    setShowSettleModal(false);
    alert('وصولی جدید با موفقیت در حساب دفتری مشتری ثبت گردید.');
  };

  const handleResetLedger = (customerId: string, customerName: string) => {
    if (window.confirm(`آیا از تسویه کامل فیکساتور و صفر کردن دفترچه حساب دفتری خریدار "${customerName}" مطمئن هستید؟ آرشیو کل ریز تراکنش‌ها حذف خواهد شد.`)) {
      onClearCustomerTransactions(customerId);
    }
  };

  // Grand totals across all credit folders
  const totalOutstandingReceivables = customers.reduce((sum, c) => sum + getCustomerBalance(c), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 text-right font-sans" dir="rtl">
      
      {/* SIDES PANELS: Outstanding receivables metric & Folder listings (5/12 widths) */}
      <div className="lg:col-span-5 flex flex-col gap-3">
        
        {/* Ledger general info block */}
        <div className="bg-slate-900 rounded-xl p-4 text-white shadow-xs flex justify-between items-center">
          <div>
            <h3 className="text-[11px] text-slate-400">مجموع کل طلب‌های دفتری (نسیه)</h3>
            <p className="text-lg font-black mt-1 text-yellow-400 font-mono">
              {totalOutstandingReceivables.toLocaleString('fa-IR')} <span className="text-[10px] font-medium font-sans">تومان</span>
            </p>
          </div>
          <div className="p-2.5 bg-white/10 rounded-lg">
            <BookOpen className="w-4 h-4 text-yellow-400" />
          </div>
        </div>

        {/* Client files search and controls list */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-4 flex flex-col gap-3 flex-1 min-h-[400px]">
          
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-slate-800 text-xs text-sans">پرونده‌های اعتباری مشتریان</h4>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-[11px] rounded-lg cursor-pointer flex items-center gap-1 transition-all border-b border-blue-850"
            >
              <Plus className="w-3.5 h-3.5" />
              پرونده جدید
            </button>
          </div>

          {/* Search bar input */}
          <div className="relative">
            <input
              type="text"
              placeholder="جستجو نام مشتری یا تماس..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 rounded-lg text-xs outline-none placeholder:text-slate-400"
            />
            <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
          </div>

          {/* Customer list scrollarea */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 max-h-[380px]" id="customer-list-folders">
            {filteredCustomers.length === 0 ? (
              <p className="text-center py-10 text-slate-400 text-xs text-sans">هیچ پرونده مشتری بر اساس فیلتر بالا یافت نشد.</p>
            ) : (
              filteredCustomers.map((c) => {
                const balance = getCustomerBalance(c);
                const isActive = c.id === activeCustomerId;
                return (
                  <button
                    key={c.id}
                    onClick={() => setActiveCustomerId(c.id)}
                    className={`w-full p-2.5 text-right flex items-center justify-between transition-all rounded-lg cursor-pointer mt-1 border ${
                      isActive 
                        ? 'bg-blue-50/50 border-blue-400' 
                        : 'hover:bg-slate-50 border-transparent'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className="p-1.5 bg-slate-50 border border-slate-200 rounded text-slate-700">
                        <User className="w-3.5 h-3.5" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 text-[11px] block">{c.name}</span>
                        <span className="text-[9.5px] text-slate-400 font-mono block mt-0.5">{c.phone || 'بدون شماره تماس'}</span>
                      </div>
                    </div>

                    <div className="text-left">
                      <span className={`text-[11px] font-black font-mono block ${balance > 0 ? 'text-amber-600' : 'text-emerald-700'}`}>
                        {balance > 0 ? `${balance.toLocaleString('fa-IR')} ت` : 'تسویه کامل'}
                      </span>
                      <span className="text-[9px] text-slate-400 block mt-0.5">مانده بدهی</span>
                    </div>
                  </button>
                );
              })
            )}
          </div>

        </div>

      </div>

      {/* RIGHT SIDE DETAIL: Ledger Statement (7/12 widths) */}
      <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 shadow-xs p-5 flex flex-col h-full min-h-[500px]">
        {activeCustomer ? (
          <div className="flex flex-col h-full gap-4">
            
            {/* Active customer folder details banner */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-slate-50 rounded-lg text-slate-800 border border-slate-200">
                  <User className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 text-sm">{activeCustomer.name}</h3>
                  <span className="text-[10px] text-slate-400 font-mono block mt-1">تلفن: {activeCustomer.phone || 'ثبت نشده'} | شناسه: {activeCustomer.id}</span>
                </div>
              </div>

              {/* Reset/Clear whole history ledger button */}
              <button
                onClick={() => handleResetLedger(activeCustomer.id, activeCustomer.name)}
                className="px-2.5 py-1 border border-rose-200 text-rose-700 hover:bg-rose-50 text-[10px] font-bold rounded cursor-pointer transition-all flex items-center justify-center gap-1"
                title="پاک کردن سابقه"
              >
                <Trash className="w-3 h-3 text-rose-500" />
                صفرکردن حساب
              </button>
            </div>

            {/* Quick Balance breakdown metrics */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-amber-50/40 rounded-lg border border-amber-100">
                <span className="text-[9.5px] text-amber-700 font-bold block">مانده بدهی فعلی (طلب شما):</span>
                <span className="font-black text-xs text-amber-800 font-mono mt-1 block">
                  {getCustomerBalance(activeCustomer).toLocaleString('fa-IR')} تومان
                </span>
              </div>
              
              <div className="p-3 bg-emerald-50/40 rounded-lg border border-emerald-100 flex items-center justify-between gap-2 overflow-hidden">
                <div>
                  <span className="text-[9.5px] text-emerald-700 font-bold block">وصول نقدی از این خریدار:</span>
                  <span className="font-black text-xs text-emerald-800 font-mono mt-1 block">
                    {activeCustomer.transactions
                      .filter((t) => t.type === 'PAYMENT')
                      .reduce((sum, t) => sum + t.amount, 0)
                      .toLocaleString('fa-IR')} تومان
                  </span>
                </div>
                
                <button
                  onClick={() => setShowSettleModal(true)}
                  className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white hover:scale-101 text-[11px] font-black rounded-xl cursor-pointer shadow-xs transition-all shrink-0"
                >
                  وصول وجه جدید +
                </button>
              </div>
            </div>

            {/* Ledger Transactions history lists */}
            <div className="flex-1 flex flex-col gap-3">
              <span className="text-xs font-bold text-gray-500 block">ریز تراکنش‌های حساب اعتباری:</span>
              <div className="border border-gray-150 rounded-xl overflow-hidden divide-y divide-gray-100 max-h-[290px] overflow-y-auto" id="ledger-history-rows">
                {activeCustomer.transactions.length === 0 ? (
                  <p className="text-center py-12 text-gray-400 text-xs">این دفترچه حساب خالیست. هیچ رویداد خرید نسیه یا پرداخت بدهی ثبت نشده است.</p>
                ) : (
                  [...activeCustomer.transactions].reverse().map((tx) => {
                    const isPayment = tx.type === 'PAYMENT';
                    return (
                      <div key={tx.id} className="p-3.5 flex items-center justify-between text-xs hover:bg-slate-50/40">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl border ${
                            isPayment 
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
                              : 'bg-amber-50 border-amber-200 text-amber-700'
                          }`}>
                            {isPayment ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <span className="font-bold text-gray-800 block">{tx.description}</span>
                            <span className="text-[10px] text-gray-400 font-mono block mt-1">{formatPersianDate(tx.date)} | شناسه: {tx.id}</span>
                          </div>
                        </div>

                        <span className={`font-mono font-black text-[12.5px] ${isPayment ? 'text-emerald-700' : 'text-amber-700'}`}>
                          {isPayment ? '-' : '+'}{tx.amount.toLocaleString('fa-IR')} ت
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

          </div>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center opacity-60 p-10 h-full">
            <BookOpen className="w-14 h-14 text-gray-300" />
            <p className="font-bold text-gray-850 text-xs mt-3">پرونده حسابی انتخاب نشده است</p>
            <p className="text-gray-400 text-[10px] mt-1">جهت بررسی گردش مالی، ریز نسیه‌ها و ثبت و دریافت وصولی‌ها، یکی از پرونده‌های سمت راست را انتخاب کنید.</p>
          </div>
        )}
      </div>

      {/* MODAL 1: Settle / Pay back portion of Debt popup */}
      {showSettleModal && activeCustomer && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleSettleSubmit} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-right">
            
            <h3 className="font-black text-slate-900 border-b border-gray-100 pb-3 flex items-center justify-start gap-1.5 text-xs md:text-sm">
              <Plus className="w-4.5 h-4.5 text-emerald-600" />
              ثبت وصولی جدید برای {activeCustomer.name}
            </h3>

            <div className="my-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500">مبلغ دریافتی (تومان):</label>
                <input
                  type="number"
                  required
                  placeholder="مثال: ۵۰,۰۰۰"
                  value={settleAmount || ''}
                  onChange={(e) => setSettleAmount(parseInt(e.target.value) || 0)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs font-mono font-bold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500">توضیحات تراکنش وصولی:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: تسویه اقساطی ماه جاری به کارت"
                  value={settleDesc}
                  onChange={(e) => setSettleDesc(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowSettleModal(false)}
                className="w-1/3 py-2 border border-gray-200 text-gray-500 hover:bg-gray-50 rounded-xl text-xs cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs cursor-pointer active:scale-98"
              >
                ثبت و کسر از بدهی
              </button>
            </div>

          </form>
        </div>
      )}

      {/* MODAL 2: Create a completely new Client Ledger Profile */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <form onSubmit={handleAddCustomerSubmit} className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-6 text-right">
            
            <h3 className="font-black text-slate-900 border-b border-gray-100 pb-3 flex items-center justify-start gap-1.5 text-xs md:text-sm">
              <Plus className="w-4.5 h-4.5 text-slate-800" />
              افتتاح پرونده حساب اعتباری جدید (نسیه)
            </h3>

            <div className="my-5 space-y-3">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500">نام و نام خانوادگی مشتری:</label>
                <input
                  type="text"
                  required
                  placeholder="مثال: آقای مهندس کریمی (سرکوچه دوم)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs font-semibold"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-gray-500">شماره تماس (جهت پیگیری مطالبات):</label>
                <input
                  type="tel"
                  placeholder="مثال: 09123456789"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  className="w-full p-2.5 bg-gray-50 border border-gray-200 focus:border-slate-800 rounded-xl outline-hidden text-xs font-mono"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-1/3 py-2 border border-gray-205 text-gray-550 hover:bg-gray-50 rounded-xl text-xs cursor-pointer"
              >
                انصراف
              </button>
              <button
                type="submit"
                className="w-2/3 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs cursor-pointer"
              >
                افتتاح و ثبت پرونده نسیه
              </button>
            </div>

          </form>
        </div>
      )}

    </div>
  );
}
