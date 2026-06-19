import React from 'react';
import { Invoice } from '../types';
import { Printer, X, FileText, Download } from 'lucide-react';

interface ReceiptModalProps {
  invoice: Invoice | null;
  onClose: () => void;
}

export function formatPersianNumber(num: number): string {
  // Pad with commas and show Persian
  return num.toLocaleString('fa-IR') + ' تومان';
}

export function formatPersianDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    // Simple custom date string
    return new Intl.DateTimeFormat('fa-IR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(d);
  } catch (e) {
    return dateStr;
  }
}

export default function ReceiptModal({ invoice, onClose }: ReceiptModalProps) {
  if (!invoice) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadTxt = () => {
    if (!invoice) return;
    
    let txt = `====================================\n`;
    txt += `          سوپرمارکت ده مارکت\n`;
    txt += `      سامانه فروشگاهی و توزیع کالا\n`;
    txt += `====================================\n`;
    txt += `شماره فاکتور: ${invoice.id}\n`;
    txt += `تاریخ: ${formatPersianDate(invoice.date)}\n`;
    txt += `صندوق‌دار: ${invoice.cashierName}\n`;
    if (invoice.customerName && invoice.customerName !== 'مشتری حضوری') {
      txt += `خریدار: ${invoice.customerName}\n`;
    }
    txt += `------------------------------------\n`;
    txt += `نام کالا              تعداد     قیمت کل\n`;
    txt += `------------------------------------\n`;
    
    invoice.items.forEach(item => {
      const namePadded = item.productName.padEnd(20, ' ').slice(0, 20);
      const qtyPadded = String(item.quantity).padStart(5, ' ');
      const totalPadded = String(item.total).padStart(10, ' ');
      txt += `${namePadded} ${qtyPadded} ${totalPadded} ت\n`;
      if (item.discount > 0) {
        txt += `   (تخفیف: -${item.discount} ت)\n`;
      }
    });
    
    txt += `------------------------------------\n`;
    txt += `جمع کل اقلام: ${invoice.subtotal.toLocaleString('fa-IR')} تومان\n`;
    if (invoice.discount > 0) {
      txt += `تخفیف فاکتور: ${invoice.discount.toLocaleString('fa-IR')} - تومان\n`;
    }
    txt += `مبلغ قابل پرداخت: ${invoice.totalBill.toLocaleString('fa-IR')} تومان\n`;
    txt += `------------------------------------\n`;
    txt += `نوع پرداخت: ${
      invoice.paymentMethod === 'CARD' ? 'کارتخوان بانکی' :
      invoice.paymentMethod === 'CASH' ? 'نقدی' : 'نسیه دفتری'
    }\n`;
    txt += `====================================\n`;
    txt += `از خرید و اعتماد شما صمیمانه سپاسگزاریم\n`;
    txt += `طراحی شده با عشق - سیستم حسابداری ده مارکت\n`;

    const blob = new Blob([txt], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `dah-market-invoice-${invoice.id}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 print:p-0 print:bg-white print:relative" id="receipt-modal-bg">
      <div className="bg-white text-gray-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh] print:shadow-none print:max-h-full print:w-full print:rounded-none">
        
        {/* Modal Header (Hidden on Print) */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 print:hidden">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
            <h3 className="font-bold text-gray-800 font-sans">پیش‌نمایش فاکتور فروش</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Thermal Ticket Content */}
        <div className="flex-1 overflow-y-auto p-6 font-sans select-none print:overflow-visible print:p-0">
          <div className="bg-[#fcfdfa] border border-dashed border-gray-300 rounded-xl p-5 mx-auto max-w-sm shadow-inner relative flex flex-col items-center print:border-none print:shadow-none print:bg-white">
            
            {/* Top jagged cut effect */}
            <div className="absolute -top-1 left-2 right-2 flex justify-between overflow-hidden h-2 select-none pointer-events-none print:hidden opacity-40">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="w-2 h-2 shrink-0 bg-gray-200 rotate-45 transform origin-top-left"></span>
              ))}
            </div>

            {/* Receipt Header */}
            <div className="text-center w-full mt-4">
              <h2 className="text-xl font-black text-gray-900 tracking-tight font-sans text-slate-900">سوپرمارکت ده مارکت</h2>
              <p className="text-xs text-slate-500 mt-1">سامانه فروشگاهی و توزیع کالای ده مارکت</p>
              <div className="h-px bg-gray-200 w-full my-3"></div>
              <p className="text-[11px] text-gray-500 font-mono flex justify-between">
                <span>شماره فاکتور:</span>
                <span className="font-bold text-gray-700">{invoice.id}</span>
              </p>
              <p className="text-[11px] text-gray-500 font-mono flex justify-between mt-1">
                <span>تاریخ و ساعت خرید:</span>
                <span className="text-gray-700">{formatPersianDate(invoice.date)}</span>
              </p>
              <p className="text-[11px] text-gray-500 font-mono flex justify-between mt-1">
                <span>متصدی صندوق:</span>
                <span className="text-gray-700">{invoice.cashierName}</span>
              </p>
              {invoice.customerName && invoice.customerName !== 'مشتری حضوری' && (
                <p className="text-[11px] text-gray-600 font-mono flex justify-between mt-1 bg-teal-50/50 px-1.5 py-0.5 rounded border border-teal-100/40">
                  <span>نام خریدار:</span>
                  <span className="font-bold text-teal-800">{invoice.customerName}</span>
                </p>
              )}
            </div>

            {/* List items */}
            <div className="w-full my-4">
              <div className="text-[11px] text-gray-400 font-bold grid grid-cols-12 pb-1 border-b border-gray-200 text-right">
                <span className="col-span-6">شرح کالا</span>
                <span className="col-span-2 text-center">تعداد</span>
                <span className="col-span-4 text-left">فی و جمع (تومان)</span>
              </div>
              
              <div className="divide-y divide-gray-100 max-h-[300px] overflow-y-auto print:max-h-none print:overflow-visible">
                {invoice.items.map((item, index) => (
                  <div key={index} className="text-xs py-2 grid grid-cols-12 items-baseline text-right">
                    <div className="col-span-6 flex flex-col pr-1">
                      <span className="font-medium text-gray-800 leading-tight">{item.productName}</span>
                      {item.discount > 0 && (
                        <span className="text-[10px] text-rose-500">
                          (تخفیف: {formatPersianNumber(item.discount)})
                        </span>
                      )}
                    </div>
                    
                    <span className="col-span-2 text-center text-gray-600 font-bold bg-gray-100/70 rounded py-0.5 mx-1 font-mono text-[10.5px]">
                      {item.quantity < 1 
                        ? `${Math.round(item.quantity * 1000)} گرم` 
                        : `${item.quantity.toLocaleString('fa-IR')}`
                      }
                    </span>
                    
                    <div className="col-span-4 text-left flex flex-col justify-end items-end font-mono">
                      <span className="text-[10px] text-gray-400">
                        {item.sellPrice.toLocaleString('fa-IR')}
                      </span>
                      <span className="font-bold text-gray-800">
                        {item.total.toLocaleString('fa-IR')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary Block */}
            <div className="w-full bg-gray-50 p-3 rounded-lg border border-gray-100 space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-gray-600">
                <span>جمع کل اقلام:</span>
                <span>{formatPersianNumber(invoice.subtotal)}</span>
              </div>
              
              {invoice.discount > 0 && (
                <div className="flex justify-between text-rose-600 font-bold">
                  <span>تخفیف فاکتور:</span>
                  <span>{formatPersianNumber(invoice.discount)} -</span>
                </div>
              )}
              
              <div className="h-px bg-gray-200 my-1"></div>
              
              <div className="flex justify-between text-gray-900 font-black text-sm">
                <span>مبلغ قابل پرداخت:</span>
                <span className="text-emerald-700">{formatPersianNumber(invoice.totalBill)}</span>
              </div>
            </div>

            {/* Payment Details */}
            <div className="w-full my-3 p-2 bg-emerald-50/40 rounded border border-emerald-100/50 flex items-center justify-between text-xs">
              <span className="text-emerald-800 font-bold">نوع پرداخت و وضعیت:</span>
              <span className="font-bold text-gray-700">
                {invoice.paymentMethod === 'CARD' && '💳 کارتخوان (بانکی)'}
                {invoice.paymentMethod === 'CASH' && '💵 نقدی (صندوق)'}
                {invoice.paymentMethod === 'DEBT' && '📓 نسیه (حساب دفتری)'}
              </span>
            </div>

            {/* Notes on Print/Modal */}
            {invoice.notes && (
              <div className="w-full my-3 p-2.5 bg-gray-50 border border-dashed border-gray-300 rounded font-sans text-[11px] text-right space-y-1">
                <div className="text-gray-500 font-bold">📝 یادداشت فاکتور / حساب نسیه:</div>
                <div className="text-gray-800 leading-relaxed font-medium">{invoice.notes}</div>
              </div>
            )}

            {/* Bottom Slogan & Thermal Graphic Code */}
            <div className="text-center w-full mt-4 space-y-2">
              <p className="text-[11px] text-gray-500 font-medium">از خرید و اعتماد شما صمیمانه سپاسگزاریم ❤️</p>
              
              {/* Fake aesthetic barcode */}
              <div className="flex flex-col items-center justify-center p-2 bg-white rounded border border-gray-200 w-full mt-2 self-center">
                <div className="flex items-center gap-0.5 justify-center h-8 select-none tracking-tight leading-none overflow-hidden pr-0.5 opacity-80 decoration-slice">
                  {Array.from({ length: 42 }).map((_, idx) => {
                    // Make simulated barcode variable widths
                    const isWhite = idx % 3 === 0 || idx === 11 || idx === 25;
                    const w = idx % 5 === 0 ? 'w-[3px]' : idx % 2 === 0 ? 'w-[1px]' : 'w-[2px]';
                    return (
                      <span
                        key={idx}
                        className={`${w} h-7 bg-gray-800 ${isWhite ? 'opacity-0' : 'opacity-100'}`}
                      />
                    );
                  })}
                </div>
                <span className="text-[9px] font-mono tracking-widest text-gray-400 mt-1">
                  * {invoice.id.toUpperCase()}-{invoice.paymentMethod} *
                </span>
              </div>
              
              <p className="text-[9px] text-gray-400">طراحی شده با عشق - سیستم حسابداری ده مارکت</p>
            </div>

            {/* Bottom jagged cut effect */}
            <div className="absolute -bottom-1 left-2 right-2 flex justify-between overflow-hidden h-2 select-none pointer-events-none print:hidden opacity-40">
              {Array.from({ length: 30 }).map((_, i) => (
                <span key={i} className="w-2 h-2 shrink-0 bg-gray-200 rotate-45 transform origin-bottom-left"></span>
              ))}
            </div>

          </div>
        </div>

        {/* Modal Buttons (Hidden on Print) */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-150 flex flex-col gap-3 print:hidden">
          <div className="flex items-center justify-between text-[10.5px] text-slate-500 font-sans leading-relaxed border-b border-slate-200/60 pb-2">
            <span>💡 مانیتور هوشمند ده مارکت:</span>
            <span className="font-medium text-blue-650">بدون نیاز به چاپگر حرارتی فیزیکی</span>
          </div>
          
          <div className="flex items-center justify-end gap-2 text-[11px]">
            <button
              onClick={onClose}
              className="px-3 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 font-medium transition-colors cursor-pointer"
            >
              بستن پنجره
            </button>
            
            <button
              onClick={handleDownloadTxt}
              className="px-3 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-bold rounded-lg flex items-center gap-1 transition-all cursor-pointer"
              title="بارگیری فایل متنی فاکتور برای شبکه‌های اجتماعی"
            >
              <FileText className="w-3.5 h-3.5 text-emerald-500" />
              دانلود متنی (.txt)
            </button>

            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-lg flex items-center gap-1 shadow-xs transition-all cursor-pointer"
              title="ذخیره بصورت PDF با مرورگر"
            >
              <Printer className="w-3.5 h-3.5" />
              ذخیره بصورت PDF / چاپ
            </button>
          </div>
          
          <p className="text-[10px] text-slate-400 text-center leading-normal mt-0.5">
            💡 راهنما: برای ذخیره بصورت فایل PDF، دکمه بالا را زده و در پنجره چاپگر، گزینه مقصد را روی <strong className="text-slate-600 font-bold">ذخیره بصورت PDF (Save as PDF)</strong> تنظیم کنید.
          </p>
        </div>

      </div>
    </div>
  );
}
