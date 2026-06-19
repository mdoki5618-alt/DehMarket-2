export function getProductImageUrl(productName: string, category: string, id?: string): string {
  const name = productName.toLowerCase();
  
  // 1. Direct barcode-level precise mapping
  if (id) {
    const cleanId = id.trim();
    switch (cleanId) {
      case '123456': // شیر کم‌چرب دبه‌ای میهن ۲ لیتری
        return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80';
      case '234567': // چیپس نمکی مزمز ۶۰ گرمی
        return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80';
      case '345678': // نوشابه خانواده کوکاکولا ۱.۵ لیتری
        return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80';
      case '456789': // ماکارونی تک ماکارون قطر ۱.۲
        return 'https://images.unsplash.com/photo-1612966608997-300410bac011?auto=format&fit=crop&w=300&q=80';
      case '567890': // پنیر سفید روزانه ۵۰۰ گرمی
        return 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=300&q=80';
      case '678901': // مایع ظرفشویی پریل ۴ لیتری لیومنی
        return 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=300&q=80';
      case '789012': // پفک چوز مینو سایز بزرگ
        return 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=300&q=80';
      case '890123': // چای کیسه‌ای گلستان ۲۵ عددی
        return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80';
      case '901234': // روغن مایع آفتابگردان حاوی ویتامین دی اویلا
        return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80';
      case '012345': // کره پاستوریزه شکلی ۱۰۰ گرمی
        return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=300&q=80';
    }
  }

  // 2. Specific Brand / Sub-Type Image matching (so different drinks/snacks look realistic and different)

  // --- نوشیدنی‌ها (Drinks) ---
  if (name.includes('پپسی') || name.includes('pepsi')) {
    // Pepsi
    return 'https://images.unsplash.com/photo-1629203851122-3726ecdf080e?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('کوکا') || name.includes('کولا') || name.includes('coke') || name.includes('coca')) {
    // Coca Cola
    return 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('فانتا') || name.includes('fanta') || name.includes('پرتقالی') || name.includes('پرتقال')) {
    // Orange Soda / Fanta
    return 'https://images.unsplash.com/photo-1624517459132-72147f8976b6?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('سون آپ') || name.includes('سون‌آپ') || name.includes('اسپرایت') || name.includes('sprite') || name.includes('7up')) {
    // Lemon Lime Soda
    return 'https://images.unsplash.com/photo-1625772290748-3909393a521f?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('ایستک') || name.includes('دلستر') || name.includes('جوجو') || name.includes('شمس') || name.includes('ماءالشعیر') || name.includes('جو')) {
    // Malt Beverage / Delster
    return 'https://images.unsplash.com/photo-1620577626359-fb2bbd394cf9?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('دوغ')) {
    // Yogurt Drink / Doogh
    return 'https://images.unsplash.com/photo-1541658016709-82535e94bc69?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('آب معدنی') || name.includes('دماوند') || name.includes('آکوافینا')) {
    // Bottled Water
    return 'https://images.unsplash.com/photo-1616118132244-521997384a3a?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('آبمیوه') || name.includes('سن ایچ') || name.includes('تکدانه') || name.includes('سان استار') || name.includes('رانی')) {
    // Fruit Juice
    return 'https://images.unsplash.com/photo-1621506289937-a8e4df240d0b?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('انرژی') || name.includes('هایپ') || name.includes('ردبول') || name.includes('hype') || name.includes('redbull')) {
    // Energy Drink
    return 'https://images.unsplash.com/photo-1622543953722-b885a1535e6e?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('چای') || name.includes('تی‌بگ')) {
    // Tea
    return 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('قهوه') || name.includes('نسکافه') || name.includes('اسپرسو') || name.includes('علی کافه')) {
    // Coffee
    return 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?auto=format&fit=crop&w=300&q=80';
  }

  // --- چیپس و پفک و تنقلات (Snacks) ---
  if (name.includes('چیپس نمکی')) {
    return 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('چیپس فلفلی') || name.includes('کچاپ')) {
    return 'https://images.unsplash.com/photo-1613967193490-1d17b930c1a1?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('چیپس سرکه') || name.includes('سرکه نمکی')) {
    return 'https://images.unsplash.com/photo-1550259114-ad7188f0a967?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('چیپس پیاز')) {
    return 'https://images.unsplash.com/photo-1621447509374-24535db7683c?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('پرینگلز') || name.includes('pringles')) {
    return 'https://images.unsplash.com/photo-1518047601542-79f18c655718?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('پفک') || name.includes('چی توز') || name.includes('چوز') || name.includes('لینا')) {
    return 'https://images.unsplash.com/photo-1505576399279-565b52d4ac71?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('شکلات') || name.includes('کاکائو') || name.includes('نوتلا') || name.includes('کیت کت')) {
    return 'https://images.unsplash.com/photo-1511381939415-e4401546383a?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('بیسکویت') || name.includes('مادر') || name.includes('پتی بور')) {
    return 'https://images.unsplash.com/photo-1548981140-bc9b26fc49e2?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('کیک') || name.includes('کلوچه') || name.includes('تی‌تاپ') || name.includes('رول')) {
    return 'https://images.unsplash.com/photo-1558961309-dbdf03b4607c?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('بستنی') || name.includes('کیم') || name.includes('عروسکی') || name.includes('مگنوم')) {
    return 'https://images.unsplash.com/photo-1501443762994-82bd5dace89a?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('لواشک') || name.includes('آلوچه') || name.includes('ترشک')) {
    return 'https://images.unsplash.com/photo-1602410714777-62ecae9e782e?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('خرما') || name.includes('رطب')) {
    return 'https://images.unsplash.com/photo-1596708051755-e4626154b2fc?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('تخمه') || name.includes('آجیل') || name.includes('پسته') || name.includes('بادام') || name.includes('تخمه کدو')) {
    return 'https://images.unsplash.com/photo-1541532713592-79a0317b6b77?auto=format&fit=crop&w=300&q=80';
  }

  // --- لبنیات و پروتئینی (Dairy & Proteins) ---
  if (name.includes('شیر')) {
    return 'https://images.unsplash.com/photo-1550583724-b2692b85b150?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('پنیر')) {
    return 'https://images.unsplash.com/photo-1486299267070-83823f5448dd?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('ماست')) {
    return 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('کره') || name.includes('شکلی') || name.includes('میهن')) {
    return 'https://images.unsplash.com/photo-1589985270826-4b7bb135bc9d?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('خامه')) {
    return 'https://images.unsplash.com/photo-1528750901443-e986c7db94a5?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('تخم مرغ') || name.includes('تخم‌مرغ')) {
    return 'https://images.unsplash.com/photo-1516448620398-c5f44bf9f441?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('گوشت') || name.includes('مرغ') || name.includes('ماهی') || name.includes('کالباس') || name.includes('سوسیس') || name.includes('همبرگر')) {
    return 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?auto=format&fit=crop&w=300&q=80';
  }

  // --- خواروبار و پخت‌و‌پز ---
  if (name.includes('برنج')) {
    return 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('روغن')) {
    return 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('ماکارونی') || name.includes('پاستا') || name.includes('لازانیا')) {
    return 'https://images.unsplash.com/photo-1612966608997-300410bac011?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('رب') || name.includes('رب گوجه')) {
    return 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('نان') || name.includes('باگت') || name.includes('لواش') || name.includes('سنگک')) {
    return 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('شکر') || name.includes('قند') || name.includes('نبات')) {
    return 'https://images.unsplash.com/photo-1581447100512-68b13ab0a9a1?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('حبوبات') || name.includes('عدس') || name.includes('لوبیا') || name.includes('نخود')) {
    return 'https://images.unsplash.com/photo-1515694346937-94d85e41e6f0?auto=format&fit=crop&w=300&q=80';
  }

  // --- شوینده و بهداشتی ---
  if (name.includes('ظرفشویی') || name.includes('پریل') || name.includes('ریکا') || name.includes('خاکستر')) {
    return 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('پودر') || name.includes('لباسشویی') || name.includes('سافتلن') || name.includes('تاژ') || name.includes('مایع لباس')) {
    return 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('دستمال') || name.includes('کاغذی') || name.includes('توالت')) {
    return 'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=300&q=80';
  }
  if (name.includes('شامپو') || name.includes('صابون') || name.includes('دوش') || name.includes('اکتیو')) {
    return 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?auto=format&fit=crop&w=300&q=80';
  }

  // --- میوه و سبزیجات ---
  if (name.includes('گوجه')) return 'https://images.unsplash.com/photo-1595855759920-86582396756a?auto=format&fit=crop&w=300&q=80';
  if (name.includes('سیب زمینی') || name.includes('سیب‌زمینی')) return 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&w=300&q=80';
  if (name.includes('پیاز')) return 'https://images.unsplash.com/photo-1508747703725-719777637510?auto=format&fit=crop&w=300&q=80';
  if (name.includes('خیار')) return 'https://images.unsplash.com/photo-1590301157890-4810ed352733?auto=format&fit=crop&w=300&q=80';
  if (name.includes('سیب')) return 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&w=300&q=80';
  if (name.includes('موز')) return 'https://images.unsplash.com/photo-1571771894821-ce9b6c11b08e?auto=format&fit=crop&w=300&q=80';
  if (name.includes('پرتقال')) return 'https://images.unsplash.com/photo-1547514701-42782101795e?auto=format&fit=crop&w=300&q=80';
  if (name.includes('لیمو')) return 'https://images.unsplash.com/photo-1590502593747-42a996133562?auto=format&fit=crop&w=300&q=80';

  // 3. Fallback to generic categories if no specific keywords met
  const cleanCategory = category.toLowerCase();
  if (cleanCategory.includes('لبنیات') || cleanCategory.includes('پروتئینی') || cleanCategory.includes('صبحانه')) {
    return 'https://images.unsplash.com/photo-1528750901443-e986c7db94a5?auto=format&fit=crop&w=300&q=80';
  }
  if (cleanCategory.includes('نوشیدنی')) {
    return 'https://images.unsplash.com/photo-1497534446932-c925b458314e?auto=format&fit=crop&w=300&q=80';
  }
  if (cleanCategory.includes('تنقلات') || cleanCategory.includes('شیرینی')) {
    return 'https://images.unsplash.com/photo-1599490659213-e21911ac4016?auto=format&fit=crop&w=300&q=80';
  }
  if (cleanCategory.includes('خواروبار') || cleanCategory.includes('اساسی') || cleanCategory.includes('قفسه')) {
    return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';
  }
  if (cleanCategory.includes('شوینده') || cleanCategory.includes('بهداشتی')) {
    return 'https://images.unsplash.com/photo-1563453392212-326f5e854473?auto=format&fit=crop&w=300&q=80';
  }
  if (cleanCategory.includes('میوه') || cleanCategory.includes('سبزی')) {
    return 'https://images.unsplash.com/photo-1610832958506-ee5633619144?auto=format&fit=crop&w=300&q=80';
  }

  // 4. Ultimate Fallback
  return 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=300&q=80';
}

/**
 * Searches the web/Digikala for a high-quality exact product image matching the barcode or name.
 * Bypasses CORS using the reliable AllOrigins wrapper.
 */
export async function fetchOnlineProductImage(productName: string, id?: string): Promise<string | null> {
  const queriesToTry: string[] = [];

  // 1. If we have a real barcode of reasonable length, lookup with that first
  if (id && id.trim().length >= 6) {
    queriesToTry.push(id.trim());
  }

  // 2. Lookup with the full descriptive product name
  if (productName && productName.trim().length > 0) {
    queriesToTry.push(productName.trim());

    // 3. Clean and simplify name to avoid strict keywords that might confuse search engine
    const cleanName = productName
      .replace(/[۰-۹0-9]+تی‌بگ|[۰-۹0-9]+عددی|[۰-۹0-9]+گرمی|[۰-۹0-9]+لیتری|[۰-۹0-9]+کیلوگرمی|[۰-۹0-9]+گرم|[۰-۹0-9]+لیتر|[۰-۹0-9]+کیلو/g, '')
      .replace(/\s+/g, ' ')
      .trim();

    if (cleanName !== productName.trim() && cleanName.length > 5) {
      queriesToTry.push(cleanName);
    }
  }

  for (const q of queriesToTry) {
    try {
      // Use AllOrigins CORS Proxy wrapper which supports wildcard headers
      const targetUrl = `https://api.digikala.com/v1/search/?q=${encodeURIComponent(q)}`;
      const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(targetUrl)}`;

      const response = await fetch(proxyUrl);
      if (!response.ok) continue;

      const data = await response.json();
      if (!data || !data.contents) continue;

      const parsed = JSON.parse(data.contents);
      if (parsed && parsed.status === 200 && parsed.data && parsed.data.products && parsed.data.products.length > 0) {
        const item = parsed.data.products[0];
        
        let foundUrl: string | null = null;
        if (item.images && item.images.main) {
          const main = item.images.main;
          if (main.url && Array.isArray(main.url) && main.url.length > 0) {
            foundUrl = main.url[0];
          } else if (typeof main.url === 'string') {
            foundUrl = main.url;
          } else if (Array.isArray(main) && main.length > 0) {
            foundUrl = main[0];
          } else if (typeof main === 'string') {
            foundUrl = main;
          }
        }

        if (foundUrl && foundUrl.startsWith('http')) {
          return foundUrl;
        }
      }
    } catch (e) {
      console.warn(`Error resolving online image for "${q}":`, e);
    }
  }

  return null;
}
