export interface Product {
  id: string; // barcode or unique fallback code
  name: string;
  category: string;
  buyPrice: number; // in Toman (or IRR)
  sellPrice: number; // in Toman (or IRR)
  stock: number;
  minStock: number; // threshold for alert
  unit: string; // 'عدد' | 'کیلوگرم' | 'بسته' | 'بطری' etc.
  imageUrl?: string;
  expiryDate?: string; // تاریخ انقضا
}

export interface CartItem {
  product: Product;
  quantity: number;
  discount: number; // discounts on this specific line item
}

export type PaymentMethod = 'CASH' | 'CARD' | 'DEBT'; // نقد، کارت، نسیه

export interface Invoice {
  id: string; // invoice number, e.g. "INV-1001"
  customerName: string;
  customerPhone?: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    sellPrice: number;
    buyPrice: number; // stored to calculate accurate historical profits even if buyPrice changes later
    discount: number;
    total: number;
  }[];
  subtotal: number;
  discount: number; // overall invoice discount
  totalBill: number;
  paymentMethod: PaymentMethod;
  date: string; // ISO date string
  cashierName: string;
  notes?: string; // یادداشت یا توضیحات فاکتور
}

export interface DebtTransaction {
  id: string;
  date: string;
  amount: number;
  type: 'DEBT' | 'PAYMENT'; // DEBT = bought on credit, PAYMENT = paid back debt
  description: string;
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  transactions: DebtTransaction[];
}
