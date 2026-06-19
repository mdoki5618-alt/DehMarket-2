export interface ExpiryStatus {
  expired: boolean;
  nearExpiry: boolean;
  label: string;
  daysRemaining?: number;
}

/**
 * Checks if a given expiry date is expired or nearing its shelf life.
 * Supports both Persian solar dates (e.g. 1405/03/15 or ۱۴۰۵/۰۳/۱۵) and Gregorian dates (e.g. 2026-12-30).
 */
export function checkExpiryState(expiryDateRaw?: string): ExpiryStatus {
  if (!expiryDateRaw || !expiryDateRaw.trim()) {
    return { expired: false, nearExpiry: false, label: 'بدون تاریخ ثبت‌شده' };
  }

  // Helper to convert Persian digits to English
  const toEnglishDigits = (str: string) => {
    return str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  };

  const cleanInput = toEnglishDigits(expiryDateRaw).trim().replace(/[-\.]/g, '/');
  
  // Extract digits for simple validation
  const digitsOnly = cleanInput.replace(/\//g, '');
  if (!digitsOnly || digitsOnly.length < 5) {
    return { expired: false, nearExpiry: false, label: 'تاریخ نامعتبر' };
  }

  // Check if it looks like a Persian solar date (starts with 13 or 14) or Gregorian (starts with 20)
  const isPersian = cleanInput.startsWith('13') || cleanInput.startsWith('14');

  if (isPersian) {
    try {
      // Normalize Persian format: "1405/3/5" -> "1405/03/05"
      const parts = cleanInput.split('/');
      if (parts.length >= 2) {
        const y = parts[0];
        const m = parts[1].padStart(2, '0');
        const d = (parts[2] || '01').padStart(2, '0');
        const normalizedExpiry = `${y}${m}${d}`;

        // Get today's Persian date via native JS Intl
        const todayFormatter = new Intl.DateTimeFormat('fa-IR-u-nu-latn', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit'
        });
        
        const todayPersianRaw = todayFormatter.format(new Date()); // e.g. "1405/03/29"
        const todayParts = todayPersianRaw.replace(/[-\.]/g, '/').split('/');
        const todayY = todayParts[0];
        const todayM = todayParts[1].padStart(2, '0');
        const todayD = todayParts[2].padStart(2, '0');
        const normalizedToday = `${todayY}${todayM}${todayD}`;

        const expVal = parseInt(normalizedExpiry, 10);
        const todayVal = parseInt(normalizedToday, 10);

        if (isNaN(expVal) || isNaN(todayVal)) {
          return { expired: false, nearExpiry: false, label: 'تاریخ نامعتبر' };
        }

        if (expVal < todayVal) {
          return { expired: true, nearExpiry: false, label: '🚨 منقضی شده' };
        } else if (expVal === todayVal) {
          return { expired: true, nearExpiry: true, label: '⏰ امروز منقضی می‌شود' };
        }
        
        // Let's see if it's within 1 month (approximate solar calculation)
        const monthDiff = (parseInt(y) - parseInt(todayY)) * 12 + (parseInt(m) - parseInt(todayM));
        if (monthDiff === 0 || (monthDiff === 1 && parseInt(d) <= parseInt(todayD))) {
          return { expired: false, nearExpiry: true, label: '⚠️ انقضا نزدیک (کمتر از ۱ ماه)' };
        }

        return { expired: false, nearExpiry: false, label: `🟢 دارای تاریخ (${y}/${m}/${d})` };
      }
    } catch (e) {
      console.error('Persian date parsing error', e);
    }
    return { expired: false, nearExpiry: false, label: 'خطا در پردازش تاریخ' };
  } else {
    // Gregorian standard format
    try {
      const expDate = new Date(cleanInput.replace(/\//g, '-'));
      if (isNaN(expDate.getTime())) {
        return { expired: false, nearExpiry: false, label: 'تاریخ نامعتبر (میلادی)' };
      }
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      expDate.setHours(0, 0, 0, 0);

      const diffMs = expDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays < 0) {
        return { expired: true, nearExpiry: false, label: `🚨 منقضی شده (${Math.abs(diffDays).toLocaleString('fa-IR')} روز قبل)` };
      } else if (diffDays === 0) {
        return { expired: true, nearExpiry: true, label: '⏰ امروز منقضی می‌شود' };
      } else if (diffDays <= 30) {
        return { expired: false, nearExpiry: true, label: `⚠️ انقضا نزدیک (${diffDays.toLocaleString('fa-IR')} روز مانده)` };
      }
      return { expired: false, nearExpiry: false, label: `🟢 دارای تاریخ (${cleanInput})` };
    } catch (e) {
      console.error('Gregorian date parsing error', e);
    }
    return { expired: false, nearExpiry: false, label: 'خطا در پردازش تاریخ' };
  }
}

/**
 * Returns a sortable score for product expiry. 
 * Expired and nearest-to-expire items get the lowest numbers.
 * Non-expiring or empty dates return a very high default value (99999999) so they stay at the bottom of ascending sort.
 */
export function getExpirySortValue(expiryDateRaw?: string): number {
  if (!expiryDateRaw || !expiryDateRaw.trim()) {
    return 99999999;
  }

  const toEnglishDigits = (str: string) => {
    return str.replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d).toString());
  };

  const cleanInput = toEnglishDigits(expiryDateRaw).trim().replace(/[-\.]/g, '/');
  const isPersian = cleanInput.startsWith('13') || cleanInput.startsWith('14');

  if (isPersian) {
    try {
      const parts = cleanInput.split('/');
      if (parts.length >= 2) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10);
        const d = parts[2] ? parseInt(parts[2], 10) : 1;
        
        const score = (y - 1300) * 365 + m * 30 + d;
        if (!isNaN(score)) return score;
      }
    } catch (e) {
      // ignore
    }
  } else {
    try {
      const expDate = new Date(cleanInput.replace(/\//g, '-'));
      if (!isNaN(expDate.getTime())) {
        const daysSinceEpoch = Math.floor(expDate.getTime() / (1000 * 60 * 60 * 24));
        return daysSinceEpoch;
      }
    } catch (e) {
      // ignore
    }
  }

  return 99999999;
}
