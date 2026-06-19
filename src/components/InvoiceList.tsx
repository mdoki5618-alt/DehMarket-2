import React, { useState } from 'react';
import { Invoice } from '../types';
import { formatPersianNumber, formatPersianDate } from './ReceiptModal';
import { Search, Calendar, Eye, Trash2, Printer, CreditCard, Receipt, DatabaseBackup, FileSpreadsheet } from 'lucide-react';

interface InvoiceListProps {
  invoices: Invoice[];
  onDeleteInvoice: (invoiceId: string) => void;
  onViewInvoice: (invoice: Invoice) => void;
}

export default function InvoiceList({
  invoices,
  onDeleteInvoice,
  onViewInvoice,
}: InvoiceListProps) {
  const [search, setSearch] = useState('');
  const [payType, setPayType] = useState<string>('همه');

  // filter
  const filtered = invoices.filter((inv) => {
    const matchesSearch = 
      inv.id.toLowerCase().includes(search.toLowerCase()) || 
      inv.customerName.toLowerCase().includes(search.toLowerCase());
    
    const matchesPayType = payType === 'همه' || inv.paymentMethod === payType;
    return matchesSearch && matchesPayType;
  });

  const getPersianMonthAndYear = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      const monthStr = new Intl.DateTimeFormat('fa-IR', { month: 'long' }).format(d).trim();
      const yearStr = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(d).trim();
      return `${monthStr} ${yearStr}`;
    } catch (e) {
      return 'نامشخص';
    }
  };

  // Group invoices by Month Year
  const monthlyGroups: Record<string, {
    monthYear: string;
    invoiceCount: number;
    totalSales: number;
    totalDiscount: number;
    invoices: Invoice[];
  }> = {};

  invoices.forEach((inv) => {
    const key = getPersianMonthAndYear(inv.date);
    if (!monthlyGroups[key]) {
      monthlyGroups[key] = {
        monthYear: key,
        invoiceCount: 0,
        totalSales: 0,
        totalDiscount: 0,
        invoices: [],
      };
    }
    monthlyGroups[key].invoiceCount += 1;
    monthlyGroups[key].totalSales += inv.totalBill;
    monthlyGroups[key].totalDiscount += inv.discount;
    monthlyGroups[key].invoices.push(inv);
  });

  const handleExportMonthExcel = (monthYearKey: string, invList: Invoice[]) => {
    const headers = [
      "شماره فاکتور",
      "تاریخ ثبت",
      "خریدار",
      "شماره تلفن خریدار",
      "شیوه پرداخت",
      "تعداد کل اقلام",
      "جمع اقلام (تومان)",
      "تخفیف کل (تومان)",
      "مبلغ قابل پرداخت (تومان)",
      "صندوق‌دار"
    ];

    const rows = invList.map(inv => {
      let payMethodStr = "";
      if (inv.paymentMethod === 'CARD') payMethodStr = "کارتخوان بانکی";
      else if (inv.paymentMethod === 'CASH') payMethodStr = "نقدی";
      else if (inv.paymentMethod === 'DEBT') payMethodStr = "نسیه دفتری";

      const totalQty = inv.items.reduce((sum, item) => sum + item.quantity, 0);

      return [
        inv.id,
        formatPersianDate(inv.date).replace(/,/g, ' -'),
        inv.customerName,
        inv.customerPhone || 'ثبت نشده',
        payMethodStr,
        totalQty,
        inv.subtotal,
        inv.discount,
        inv.totalBill,
        inv.cashierName
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
    const filenameSafe = monthYearKey.replace(/\s+/g, '-');
    link.download = `dah-market-report-${filenameSafe}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm(`هشدار حسابداری: آیا از ابطال فاکتور "${id}" مطمئن هستید؟ این کار مجدداً تعداد اقلام برداشته شده را به انبار برگشت خواهد داد.`)) {
      onDeleteInvoice(id);
    }
  };

  const handleExportExcel = () => {
    if (filtered.length === 0) {
      alert("هیچ فاکتوری برای خروجی اکسل وجود ندارد.");
      return;
    }

    const headers = [
      "شماره فاکتور",
      "تاریخ ثبت",
      "خریدار",
      "شماره تلفن خریدار",
      "شیوه پرداخت",
      "تعداد کل اقلام",
      "جمع اقلام (تومان)",
      "تخفیف کل (تومان)",
      "مبلغ قابل پرداخت (تومان)",
      "صندوق‌دار"
    ];

    const rows = filtered.map(inv => {
      let payMethodStr = "";
      if (inv.paymentMethod === 'CARD') payMethodStr = "کارتخوان بانکی";
      else if (inv.paymentMethod === 'CASH') payMethodStr = "نقدی";
      else if (inv.paymentMethod === 'DEBT') payMethodStr = "نسیه دفتری";

      const totalQty = inv.items.reduce((sum, item) => sum + item.quantity, 0);

      return [
        inv.id,
        formatPersianDate(inv.date).replace(/,/g, ' -'), // Clean commas
        inv.customerName,
        inv.customerPhone || 'ثبت نشده',
        payMethodStr,
        totalQty,
        inv.subtotal,
        inv.discount,
        inv.totalBill,
        inv.cashierName
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
    link.download = `dah-market-invoices-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4 text-right font-sans" dir="rtl">
      
      {/* Title block */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
        <h2 className="text-xs font-bold text-slate-800 flex items-center gap-2">
          <span className="w-1.5 h-4 bg-blue-600 rounded-sm"></span>
          دفتر ثبت فاکتورهای فروش
        </h2>
        <p className="text-[11px] text-slate-400 mt-1">امکان ابطال و اصلاح فاکتورها، مشاهده فایل‌های آماده چاپ و بررسی شیوه پرداخت مشتریان</p>
      </div>

      {/* Filter controls */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        
        {/* Text Filter */}
        <div className="md:col-span-2 relative">
          <input
            type="text"
            placeholder="جستجوی شماره فاکتور یا نام خریدار..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-3 pr-9 py-2 bg-white border border-slate-200 focus:ring-2 focus:ring-blue-500 rounded-lg text-xs outline-none placeholder:text-slate-400"
          />
          <Search className="w-4 h-4 absolute right-3 top-2.5 text-slate-400" />
        </div>

        {/* Dropdowns */}
        <div className="md:col-span-2 flex gap-3 text-xs">
          <select
            value={payType}
            onChange={(e) => setPayType(e.target.value)}
            className="flex-1 p-2 bg-white border border-slate-200 rounded-lg outline-none cursor-pointer font-bold text-slate-700"
          >
            <option value="همه">همه شیوه‌های دریافت وجه</option>
            <option value="CARD">💳 کارتخوان بانکی</option>
            <option value="CASH">💵 نقدی</option>
            <option value="DEBT">📓 نسیه‌ دفتری</option>
          </select>

          <button
            onClick={handleExportExcel}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg flex items-center gap-1.5 transition-all cursor-pointer shadow-2xs border-b-2 border-emerald-800"
            title="ذخیره فاکتورها در قالب فایل اکسل ایرانی"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-100" />
            <span>خروجی اکسل فاکتورها</span>
          </button>
        </div>

      </div>

      {/* 📊 SEAMLESS MONTHLY EXCEL REPORT BOOKKEEPER */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="p-1 rounded bg-blue-100 text-blue-750 font-sans">⚖️</span>
            <span className="text-[11px] font-extrabold text-slate-800">بایگانی هوشمند و ذخیره خودکار ماهانه فاکتورها (خروجی مستقیم اکسل دسکتاپ)</span>
          </div>
          <span className="text-[10px] text-slate-400 font-medium">تفکیک فاکتورهای فروشگاه و حسابداری کل به صورت ماهانه</span>
        </div>

        {Object.keys(monthlyGroups).length === 0 ? (
          <div className="text-center text-[10.5px] text-slate-400 py-3">هیچ گزارشی برای تفکیک ماهانه وجود ندارد. ابتدا اولین فروش خود را ثبت کنید.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {Object.values(monthlyGroups).map((group) => (
              <div 
                key={group.monthYear}
                className="bg-white border border-slate-1.5/60 rounded-lg p-3 shadow-2xs hover:border-blue-300 transition-all flex items-center justify-between gap-2"
              >
                <div className="space-y-1">
                  <span className="font-extrabold text-xs text-slate-800 block">🗓️ گزارش ماه {group.monthYear}</span>
                  <span className="text-[10px] text-slate-500 block font-mono">
                    {group.invoiceCount.toLocaleString('fa-IR')} فاکتور | جمع: {group.totalSales.toLocaleString('fa-IR')} ت
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => handleExportMonthExcel(group.monthYear, group.invoices)}
                  className="px-2.5 py-1.5 text-[10.5px] bg-sky-50 hover:bg-sky-100 text-sky-700 border border-sky-150 hover:border-sky-300 font-extrabold rounded-md flex items-center gap-1 shrink-0 cursor-pointer transition-colors"
                  title="دانلود گزارش کامل اکسل این ماه مخصوص کامپیوتر"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-sky-600" />
                  <span>دانلود اکسل</span>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Table invoices registry */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-205 text-slate-500 font-bold text-[10.5px] select-none">
                <th className="p-3 text-center">شماره فاکتور</th>
                <th className="p-3">خریدار کالا</th>
                <th className="p-3 text-center">ساعت ثبت فاکتور</th>
                <th className="p-3 text-center">روش تسویه</th>
                <th className="p-3 text-center">تعداد اقلام</th>
                <th className="p-3 text-center">جمع کل فاکتور</th>
                <th className="p-3 text-center">تخفیف کل</th>
                <th className="p-3 text-center">مبلغ دریافتی</th>
                <th className="p-3 text-center">بایگانی فیش</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-12 text-center text-slate-400">
                    هیچ حواله یا فاکتور فروشی متناسب شرایط فوق یافت نشد.
                  </td>
                </tr>
              ) : (
                filtered.map((inv) => (
                  <tr 
                    key={inv.id} 
                    onClick={() => onViewInvoice(inv)}
                    className="hover:bg-slate-50/50 cursor-pointer transition-colors"
                  >
                    
                    {/* Invoice ID */}
                    <td className="p-3 text-center font-mono font-bold text-slate-800">
                      {inv.id}
                    </td>

                    {/* Customer Name */}
                    <td className="p-3">
                      <span className="font-bold text-slate-800 block">
                        {inv.customerName}
                      </span>
                      {inv.customerPhone && (
                        <span className="text-[10px] text-slate-400 font-mono block mt-0.5">
                          {inv.customerPhone}
                        </span>
                      )}
                      {inv.notes && (
                        <span className="text-[9.5px] text-slate-600 bg-slate-100 rounded px-1 py-0.5 block mt-1.5 border border-slate-1/60 leading-relaxed max-w-[200px] whitespace-normal">
                          ✍️ {inv.notes}
                        </span>
                      )}
                    </td>

                    {/* Formatted Date */}
                    <td className="p-3 text-center text-slate-500">
                      {formatPersianDate(inv.date)}
                    </td>

                    {/* Payment type and tag style */}
                    <td className="p-3 text-center select-none">
                      {inv.paymentMethod === 'CARD' && (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold bg-blue-50 text-blue-700 border border-blue-100">
                          💳 کارتخوان
                        </span>
                      )}
                      {inv.paymentMethod === 'CASH' && (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-100">
                          💵 نقد
                        </span>
                      )}
                      {inv.paymentMethod === 'DEBT' && (
                        <span className="inline-flex px-2 py-0.5 rounded-md text-[9px] font-bold bg-amber-50 text-amber-700 border border-amber-100">
                          📓 نسیه دفتری
                        </span>
                      )}
                    </td>

                    {/* items sum quantity */}
                    <td className="p-3 text-center font-mono font-medium text-slate-600">
                      {inv.items.reduce((sum, item) => sum + item.quantity, 0).toLocaleString('fa-IR')} قلم
                    </td>

                    {/* Base total bill */}
                    <td className="p-3 text-center font-mono text-slate-600">
                      {inv.subtotal.toLocaleString('fa-IR')}
                    </td>

                    {/* Total discount deducted */}
                    <td className="p-3 text-center font-mono text-rose-500 font-bold">
                      {inv.discount > 0 ? `-${inv.discount.toLocaleString('fa-IR')}` : '۰'}
                    </td>

                    {/* Net collected amount */}
                    <td className="p-3 text-center font-mono font-black text-slate-800">
                      {inv.totalBill.toLocaleString('fa-IR')} تومان
                    </td>

                    {/* Action buttons preview / delete */}
                    <td className="p-3 text-center" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onViewInvoice(inv)}
                          className="p-1 px-1.5 border border-slate-200 hover:border-blue-400 bg-white text-slate-700 rounded-md transition-colors cursor-pointer"
                          title="مشاهده فاکتور"
                        >
                          <Eye className="w-3.5 h-3.5 text-blue-500" />
                        </button>
                        
                        <button
                          onClick={(e) => handleDelete(inv.id, e)}
                          className="p-1 px-1.5 border border-slate-200 hover:border-red-400 bg-white text-slate-700 rounded-md transition-colors cursor-pointer"
                          title="ابطال فاکتور"
                        >
                          <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
}
