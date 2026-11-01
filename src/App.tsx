import React, { useState, useMemo } from 'react';
import { 
  Coffee, 
  ShoppingBag, 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  Phone, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  QrCode, 
  Send, 
  Copy, 
  Check, 
  Download, 
  Code2, 
  Sparkles, 
  ChevronRight,
  Info,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
  ReceiptText
} from 'lucide-react';
import { MENU_ITEMS, SHOP_CONFIG, MenuItem } from './data/menu.ts';
import { PYTHON_APP_CODE } from './data/pythonScript.ts';

export default function App() {
  // Navigation / View State
  const [activeTab, setActiveTab] = useState<'store' | 'code' | 'about'>('store');
  
  // Menu State
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Cart State: { [itemId: string]: number }
  const [cart, setCart] = useState<Record<string, number>>({
    item_1: 2, // Default friendly starter cart
    item_4: 1,
  });

  // Checkout Form State
  const [customerName, setCustomerName] = useState<string>('');
  const [customerPhone, setCustomerPhone] = useState<string>('');
  const [deliveryAddress, setDeliveryAddress] = useState<string>('');
  const [selectedLandmark, setSelectedLandmark] = useState<string>('');
  const [specialNotes, setSpecialNotes] = useState<string>('');
  const [paymentMode, setPaymentMode] = useState<'upi' | 'cod'>('upi');
  
  // Validation & Order Confirmation State
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [placedOrder, setPlacedOrder] = useState<{
    orderId: string;
    timestamp: string;
    name: string;
    phone: string;
    address: string;
    items: Array<{ item: MenuItem; qty: number; subtotal: number }>;
    itemTotal: number;
    deliveryFee: number;
    tax: number;
    grandTotal: number;
    paymentMode: 'upi' | 'cod';
    notes?: string;
  } | null>(null);

  // Copy states
  const [codeCopied, setCodeCopied] = useState<boolean>(false);
  const [upiCopied, setUpiCopied] = useState<boolean>(false);
  const [msgCopied, setMsgCopied] = useState<boolean>(false);

  // Cart operations
  const addToCart = (id: string) => {
    setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
  };

  const removeFromCart = (id: string) => {
    setCart((prev) => {
      const current = prev[id] || 0;
      if (current <= 1) {
        const next = { ...prev };
        delete next[id];
        return next;
      }
      return { ...prev, [id]: current - 1 };
    });
  };

  const clearCart = () => {
    setCart({});
  };

  // Filtered menu items
  const filteredItems = useMemo(() => {
    return MENU_ITEMS.filter((item) => {
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.tamilName.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [selectedCategory, searchQuery]);

  // Cart items data & calculations
  const cartData = useMemo(() => {
    const list: Array<{ item: MenuItem; qty: number; subtotal: number }> = [];
    let itemTotal = 0;
    let totalItemsCount = 0;

    for (const item of MENU_ITEMS) {
      const qty = cart[item.id] || 0;
      if (qty > 0) {
        const subtotal = qty * item.price;
        itemTotal += subtotal;
        totalItemsCount += qty;
        list.push({ item, qty, subtotal });
      }
    }

    const deliveryFee = itemTotal >= SHOP_CONFIG.freeDeliveryThreshold || itemTotal === 0 ? 0 : SHOP_CONFIG.deliveryFee;
    const tax = Math.round(itemTotal * SHOP_CONFIG.gstRate * 100) / 100;
    const grandTotal = Math.round((itemTotal + deliveryFee + tax) * 100) / 100;
    const shortfall = Math.max(0, SHOP_CONFIG.freeDeliveryThreshold - itemTotal);

    return {
      list,
      itemTotal,
      totalItemsCount,
      deliveryFee,
      tax,
      grandTotal,
      shortfall,
      freeDeliveryUnlocked: itemTotal >= SHOP_CONFIG.freeDeliveryThreshold && itemTotal > 0,
    };
  }, [cart]);

  // Build WhatsApp URL & Message
  const getWhatsAppInfo = (order = placedOrder) => {
    if (!order) return { url: '#', messageText: '' };

    const paymentLabel = order.paymentMode === 'upi' ? 'UPI / Online Payment' : 'Cash on Delivery (COD)';
    const deliveryLabel = order.deliveryFee === 0 ? 'FREE' : `₹${order.deliveryFee.toFixed(2)}`;

    const lines = [
      `☕ *NEW ORDER: ${SHOP_CONFIG.name}*`,
      `📍 *Outlet:* ${SHOP_CONFIG.location}`,
      `🆔 *Order ID:* ${order.orderId}`,
      `🕒 *Time:* ${order.timestamp}`,
      ``,
      `👤 *CUSTOMER DETAILS*`,
      `• *Name:* ${order.name}`,
      `• *Mobile:* +91 ${order.phone}`,
      `• *Keelkattalai Address:* ${order.address}`,
    ];

    if (order.notes) {
      lines.push(`• *Special Note:* ${order.notes}`);
    }

    lines.push(
      ``,
      `📦 *ORDERED ITEMS*`,
    );

    order.items.forEach((row) => {
      lines.push(`• ${row.item.name} x ${row.qty} = ₹${row.subtotal}`);
    });

    lines.push(
      ``,
      `🧾 *BILL BREAKDOWN*`,
      `• Item Total: ₹${order.itemTotal.toFixed(2)}`,
      `• Delivery Fee: ${deliveryLabel}`,
      `• GST (5%): ₹${order.tax.toFixed(2)}`,
      `• *GRAND TOTAL: ₹${order.grandTotal.toFixed(2)}*`,
      `• *Payment Mode:* ${paymentLabel}`,
      ``,
      `🙏 *Please confirm order & dispatch fresh batch!*`
    );

    const messageText = lines.join('\n');
    const url = `https://wa.me/${SHOP_CONFIG.phone}?text=${encodeURIComponent(messageText)}`;
    return { url, messageText };
  };

  // Handle Order Submit & Auto-Dispatch to WhatsApp
  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const errors: Record<string, string> = {};

    if (!customerName.trim()) {
      errors.name = 'Please enter your full name';
    }

    const cleanPhone = customerPhone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length !== 10) {
      errors.phone = 'Please enter a valid 10-digit mobile number';
    }

    if (!deliveryAddress.trim()) {
      errors.address = 'Please enter your street & door number in Keelkattalai';
    }

    if (cartData.list.length === 0) {
      errors.cart = 'Your cart is empty. Add items from the menu first!';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    setFormErrors({});

    // Generate unique order ID
    const datePart = new Date().toISOString().slice(2, 10).replace(/-/g, '');
    const randPart = Math.floor(100 + Math.random() * 900);
    const orderId = `BPLUS-${datePart}-${randPart}`;
    const readableTimestamp = new Date().toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    let fullLoc = deliveryAddress.trim();
    if (selectedLandmark) {
      fullLoc += ` (Near ${selectedLandmark})`;
    }
    fullLoc += `, Keelkattalai, Chennai`;

    const newOrder = {
      orderId,
      timestamp: readableTimestamp,
      name: customerName.trim(),
      phone: cleanPhone,
      address: fullLoc,
      items: cartData.list,
      itemTotal: cartData.itemTotal,
      deliveryFee: cartData.deliveryFee,
      tax: cartData.tax,
      grandTotal: cartData.grandTotal,
      paymentMode,
      notes: specialNotes.trim() || undefined,
    };

    setPlacedOrder(newOrder);

    // AUTOMATICALLY SEND ORDER INTO WHATSAPP
    const { url: waUrl } = getWhatsAppInfo(newOrder);
    if (waUrl && waUrl !== '#') {
      try {
        const link = document.createElement('a');
        link.href = waUrl;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (err) {
        console.error('Auto WhatsApp redirect error:', err);
      }
    }
  };

  // Dynamic UPI URL
  const getUpiUrl = (amount: number, orderId: string) => {
    const note = `Order ${orderId} at ${SHOP_CONFIG.name}`;
    const uri = `upi://pay?pa=${SHOP_CONFIG.upiId}&pn=${encodeURIComponent(SHOP_CONFIG.name)}&am=${amount.toFixed(2)}&cu=INR&tn=${encodeURIComponent(note)}`;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&margin=8&data=${encodeURIComponent(uri)}`;
    return { uri, qrUrl };
  };

  // Download Python file helper
  const handleDownloadPy = () => {
    const blob = new Blob([PYTHON_APP_CODE], { type: 'text/x-python;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'app.py';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Copy helper
  const handleCopyCode = () => {
    navigator.clipboard.writeText(PYTHON_APP_CODE);
    setCodeCopied(true);
    setTimeout(() => setCodeCopied(false), 2500);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(SHOP_CONFIG.upiId);
    setUpiCopied(true);
    setTimeout(() => setUpiCopied(false), 2000);
  };

  const handleCopyWhatsAppMsg = (text: string) => {
    navigator.clipboard.writeText(text);
    setMsgCopied(true);
    setTimeout(() => setMsgCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] text-[#1C1C1C] flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-gray-200 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Brand Logo & Location */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-gradient-to-tr from-[#9BE5AA] to-[#72ca86] flex items-center justify-center text-[#0d3516] shadow-md shadow-emerald-500/20 border border-[#85d896]">
              <Coffee className="w-6 h-6 stroke-[2.2]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-xl sm:text-2xl tracking-tight text-gray-900">
                  B+ Coffee Shop
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-green-50 text-green-700 border border-green-200">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-600 animate-pulse"></span>
                  OPEN NOW
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
                <MapPin className="w-3.5 h-3.5 text-[#1b6b32]" />
                <span>Medavakkam Main Rd, Keelkattalai, Chennai</span>
                <span className="hidden md:inline">• ⭐ {SHOP_CONFIG.rating} ({SHOP_CONFIG.totalReviews}+ reviews)</span>
              </div>
            </div>
          </div>

          {/* Navigation Pill Switcher */}
          <div className="flex items-center gap-2">
            <div className="flex p-1 bg-gray-100 rounded-xl text-xs sm:text-sm font-semibold">
              <button
                onClick={() => setActiveTab('store')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'store'
                    ? 'bg-white text-[#0d3516] font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4 text-[#1b6b32]" />
                <span className="hidden sm:inline">Online Store</span>
                <span className="sm:hidden">Store</span>
              </button>

              <button
                onClick={() => setActiveTab('code')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'code'
                    ? 'bg-white text-[#0d3516] font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Code2 className="w-4 h-4 text-[#1b6b32]" />
                <span>Python Script</span>
                <span className="text-[10px] bg-[#9BE5AA]/40 text-[#0d3516] border border-[#85d896] px-1.5 py-0.2 rounded font-mono font-bold">
                  app.py
                </span>
              </button>

              <button
                onClick={() => setActiveTab('about')}
                className={`px-3 sm:px-4 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                  activeTab === 'about'
                    ? 'bg-white text-[#0d3516] font-bold shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Info className="w-4 h-4 text-[#1b6b32]" />
                <span className="hidden md:inline">Stall Info</span>
              </button>
            </div>

            {/* Quick Cart Trigger (Mobile View) */}
            {activeTab === 'store' && (
              <a
                href="#cart-section"
                className="relative lg:hidden p-2 rounded-xl bg-[#9BE5AA]/30 text-[#0d3516] hover:bg-[#9BE5AA]/50 border border-[#85d896] transition"
              >
                <ShoppingBag className="w-5 h-5 text-[#0d3516]" />
                {cartData.totalItemsCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#9BE5AA] text-[#0d3516] text-[11px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-white shadow-xs">
                    {cartData.totalItemsCount}
                  </span>
                )}
              </a>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* ========================================================= */}
        {/* TAB 1: ONLINE STOREFRONT (ZOMATO THEMED)                 */}
        {/* ========================================================= */}
        {activeTab === 'store' && (
          <div>
            {/* Zomato-inspired Hero Header Banner with #9BE5AA Green Theme */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#9BE5AA] via-[#86d997] to-[#71cb84] text-[#0d3516] p-6 sm:p-8 mb-8 shadow-xl shadow-emerald-500/15 border border-[#85d896]">
              <div className="relative z-10 max-w-3xl">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#0d3516]/10 backdrop-blur-md text-xs font-bold uppercase tracking-wider mb-3 text-[#0d3516]">
                  <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                  Keelkattalai's Favorite Tea Stall & Snack Center
                </div>
                <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight leading-tight text-[#0d3516]">
                  Hot Kumbakonam Degree Coffee & Steaming Crispy Bajjis
                </h1>
                <p className="mt-2 text-[#13421d] text-sm sm:text-base leading-relaxed font-medium">
                  Freshly fried batch every 15 minutes. Delivered piping hot to your doorstep anywhere in Keelkattalai within 20-30 mins!
                </p>

                {/* Key feature pills */}
                <div className="mt-5 flex flex-wrap items-center gap-2 sm:gap-3 text-xs font-semibold">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d3516]/10 backdrop-blur-sm text-[#0d3516]">
                    <Clock className="w-3.5 h-3.5 text-emerald-900" />
                    <span>20-30 Mins Delivery</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d3516]/10 backdrop-blur-sm text-[#0d3516]">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-900" />
                    <span>100% Pure Vegetarian</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d3516]/10 backdrop-blur-sm text-[#0d3516]">
                    <QrCode className="w-3.5 h-3.5 text-emerald-900" />
                    <span>Instant UPI & COD</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#0d3516] text-[#9BE5AA] font-bold shadow-xs">
                    <Sparkles className="w-3.5 h-3.5 text-[#9BE5AA]" />
                    <span>FREE Delivery on ₹{SHOP_CONFIG.freeDeliveryThreshold}+</span>
                  </div>
                </div>
              </div>

              {/* Decorative background circle */}
              <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-white/20 blur-2xl pointer-events-none"></div>
            </div>

            {/* 2-Column Responsive Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT COLUMN: Menu & Filter Catalog (8 cols) */}
              <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                {/* Search & Category Filter Controls */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-gray-200/80 shadow-xs space-y-4">
                  {/* Search Input */}
                  <div className="relative">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search Degree Coffee, Vazhakkai Bajji, Medu Vada, Samosa..."
                      className="w-full pl-11 pr-4 py-2.5 rounded-xl border border-gray-200 bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#9BE5AA] focus:border-transparent text-sm font-medium transition"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 hover:text-gray-600 bg-gray-200 px-1.5 py-0.5 rounded"
                      >
                        Clear
                      </button>
                    )}
                  </div>

                  {/* Category Pills */}
                  <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                    {(['All', 'Hot Beverages', 'Evening Snacks', 'Crispy Bites'] as const).map((cat) => {
                      const count =
                        cat === 'All'
                          ? MENU_ITEMS.length
                          : MENU_ITEMS.filter((i) => i.category === cat).length;
                      const isActive = selectedCategory === cat;
                      return (
                        <button
                          key={cat}
                          onClick={() => setSelectedCategory(cat)}
                          className={`px-3.5 py-1.5 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                            isActive
                              ? 'bg-[#9BE5AA] text-[#0d3516] font-bold shadow-sm shadow-emerald-500/20 border border-[#85d896]'
                              : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-900'
                          }`}
                        >
                          <span>{cat}</span>
                          <span
                            className={`text-xs px-1.5 py-0.2 rounded-full ${
                              isActive ? 'bg-[#0d3516]/15 text-[#0d3516] font-bold' : 'bg-gray-200 text-gray-700'
                            }`}
                          >
                            {count}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Menu Items List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <span>{selectedCategory}</span>
                      <span className="text-xs font-normal text-gray-500">
                        ({filteredItems.length} items available)
                      </span>
                    </h2>
                    <span className="text-xs font-semibold text-green-700 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-green-500"></span>
                      100% Pure Veg Kitchen
                    </span>
                  </div>

                  {filteredItems.length === 0 ? (
                    <div className="bg-white rounded-2xl p-10 text-center border border-gray-200">
                      <Coffee className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <h3 className="font-bold text-gray-800">No items found</h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Try searching for another snack or reset your category filter.
                      </p>
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSelectedCategory('All');
                        }}
                        className="mt-4 px-4 py-2 bg-[#9BE5AA]/30 text-[#0d3516] text-xs font-bold rounded-lg hover:bg-[#9BE5AA]/50 border border-[#85d896] transition"
                      >
                        Reset Filters
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {filteredItems.map((item) => {
                        const qty = cart[item.id] || 0;
                        return (
                          <div
                            key={item.id}
                            className="bg-white rounded-2xl border border-gray-200/90 p-4 hover:shadow-md hover:border-[#9BE5AA] transition duration-200 flex flex-col justify-between group"
                          >
                            <div>
                              {/* Top row: Veg Badge, Badge Tag, Prep Time */}
                              <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-1.5">
                                  {/* Authentic FSSAI Veg Symbol: Green square with green circle inside */}
                                  <div className="w-4 h-4 rounded-[3px] border-2 border-emerald-600 flex items-center justify-center p-0.5">
                                    <div className="w-2 h-2 rounded-full bg-emerald-600"></div>
                                  </div>
                                  <span className="text-[11px] font-bold text-emerald-700 tracking-wide uppercase">
                                    Veg
                                  </span>
                                </div>

                                {item.badge && (
                                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200">
                                    {item.badge}
                                  </span>
                                )}
                              </div>

                              {/* Title and Tamil subtitle */}
                              <h3 className="font-bold text-gray-900 text-base group-hover:text-[#1b6b32] transition-colors leading-snug">
                                {item.name}
                              </h3>
                              <p className="text-xs text-gray-400 font-medium">
                                {item.tamilName}
                              </p>

                              {/* Price */}
                              <div className="mt-2 flex items-baseline gap-2">
                                <span className="text-lg font-extrabold text-gray-900">
                                  ₹{item.price}
                                </span>
                                <span className="text-[11px] text-gray-400">
                                  • {item.prepTime}
                                </span>
                              </div>

                              {/* Description */}
                              <p className="mt-2 text-xs text-gray-600 leading-relaxed line-clamp-2">
                                {item.description}
                              </p>
                            </div>

                            {/* Bottom row: Food thumbnail & Stepper Action */}
                            <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-gray-100 shrink-0 border border-gray-200">
                                <img
                                  src={item.image}
                                  alt={item.name}
                                  className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                  onError={(e) => {
                                    // Fallback if network blocked
                                    (e.target as HTMLElement).style.display = 'none';
                                  }}
                                />
                              </div>

                              {/* Interactive Counter / ADD Button */}
                              <div>
                                {qty === 0 ? (
                                  <button
                                    onClick={() => addToCart(item.id)}
                                    className="px-5 py-2 rounded-xl bg-white border-2 border-[#9BE5AA] text-[#0d3516] font-extrabold text-xs uppercase tracking-wider hover:bg-[#9BE5AA] hover:text-[#0d3516] shadow-xs hover:shadow-md hover:shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-1.5"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>ADD</span>
                                  </button>
                                ) : (
                                  <div className="flex items-center rounded-xl bg-[#9BE5AA] text-[#0d3516] shadow-md shadow-emerald-500/20 border border-[#85d896] p-0.5">
                                    <button
                                      onClick={() => removeFromCart(item.id)}
                                      className="p-1.5 hover:bg-black/10 rounded-lg active:scale-90 transition"
                                      aria-label="Decrease quantity"
                                    >
                                      <Minus className="w-3.5 h-3.5" />
                                    </button>
                                    <span className="w-8 text-center text-xs font-black">
                                      {qty}
                                    </span>
                                    <button
                                      onClick={() => addToCart(item.id)}
                                      className="p-1.5 hover:bg-black/10 rounded-lg active:scale-90 transition"
                                      aria-label="Increase quantity"
                                    >
                                      <Plus className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              {/* RIGHT COLUMN: Live Persistent Cart & Keelkattalai Checkout (4-5 cols) */}
              <div id="cart-section" className="lg:col-span-5 xl:col-span-4 sticky top-24 space-y-4">
                <div className="bg-white rounded-2xl border border-gray-200/90 shadow-md p-5">
                  {/* Cart Header */}
                  <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <ShoppingBag className="w-5 h-5 text-[#1b6b32]" />
                      <h3 className="font-extrabold text-base text-gray-900">Your Fresh Order</h3>
                    </div>
                    {cartData.list.length > 0 && (
                      <button
                        onClick={clearCart}
                        className="text-xs text-gray-400 hover:text-red-600 flex items-center gap-1 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>

                  {/* Free Delivery Goal Bar */}
                  {cartData.list.length > 0 && (
                    <div className="mt-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                      {cartData.freeDeliveryUnlocked ? (
                        <div className="flex items-center gap-2 text-xs font-bold text-emerald-700">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                          <span>YAY! FREE DELIVERY UNLOCKED (Order &gt; ₹150)</span>
                        </div>
                      ) : (
                        <div>
                          <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1.5">
                            <span>Add ₹{cartData.shortfall.toFixed(0)} more for FREE Delivery!</span>
                            <span className="text-[#1b6b32] font-black">₹{cartData.itemTotal} / ₹{SHOP_CONFIG.freeDeliveryThreshold}</span>
                          </div>
                          <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden">
                            <div
                              className="bg-[#9BE5AA] h-full transition-all duration-300 rounded-full"
                              style={{
                                width: `${Math.min(100, (cartData.itemTotal / SHOP_CONFIG.freeDeliveryThreshold) * 100)}%`,
                              }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Cart Items List */}
                  {cartData.list.length === 0 ? (
                    <div className="py-10 text-center">
                      <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-[#9BE5AA]/30 text-[#0d3516] border border-[#85d896] flex items-center justify-center">
                        <ShoppingBag className="w-8 h-8" />
                      </div>
                      <h4 className="font-bold text-gray-800 text-sm">Your cart is empty</h4>
                      <p className="text-xs text-gray-400 mt-1 max-w-[200px] mx-auto">
                        Add Kumbakonam Degree Coffee or hot onion bondas to get started!
                      </p>
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto my-3 pr-1">
                      {cartData.list.map(({ item, qty, subtotal }) => (
                        <div key={item.id} className="py-2.5 flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5 min-w-0">
                            {/* Veg dot */}
                            <div className="w-3 h-3 rounded-[2px] border border-emerald-600 flex items-center justify-center p-0.5 shrink-0">
                              <div className="w-1.5 h-1.5 rounded-full bg-emerald-600"></div>
                            </div>
                            <div className="truncate">
                              <p className="text-xs font-bold text-gray-900 truncate">
                                {item.name}
                              </p>
                              <p className="text-[11px] text-gray-500">
                                ₹{item.price} each
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-3 shrink-0">
                            {/* Stepper */}
                            <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden bg-gray-50">
                              <button
                                onClick={() => removeFromCart(item.id)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-200 hover:text-black transition"
                              >
                                <Minus className="w-3 h-3" />
                              </button>
                              <span className="px-2 text-xs font-bold text-gray-900">
                                {qty}
                              </span>
                              <button
                                onClick={() => addToCart(item.id)}
                                className="px-2 py-1 text-gray-600 hover:bg-gray-200 hover:text-black transition"
                              >
                                <Plus className="w-3 h-3" />
                              </button>
                            </div>

                            <span className="w-12 text-right text-xs font-bold text-gray-900">
                              ₹{subtotal}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Bill Breakdown */}
                  {cartData.list.length > 0 && (
                    <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                      <div className="flex justify-between">
                        <span>Item Total</span>
                        <span className="font-semibold text-gray-800">₹{cartData.itemTotal.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Delivery Fee (Keelkattalai)</span>
                        {cartData.deliveryFee === 0 ? (
                          <span className="font-bold text-emerald-600">FREE</span>
                        ) : (
                          <span className="font-semibold text-gray-800">₹{cartData.deliveryFee.toFixed(2)}</span>
                        )}
                      </div>
                      <div className="flex justify-between">
                        <span>Taxes &amp; Stall Charges (5% GST)</span>
                        <span className="font-semibold text-gray-800">₹{cartData.tax.toFixed(2)}</span>
                      </div>
                      <div className="pt-2 border-t border-dashed border-gray-200 flex justify-between text-sm font-extrabold text-gray-900">
                        <span>To Pay</span>
                        <span className="text-[#1b6b32] text-base font-black">₹{cartData.grandTotal.toFixed(2)}</span>
                      </div>
                    </div>
                  )}

                  {/* Customer & Delivery Details Form */}
                  {cartData.list.length > 0 && (
                    <form onSubmit={handlePlaceOrder} className="mt-5 pt-4 border-t border-gray-100 space-y-3">
                      <div className="flex items-center gap-1.5 text-xs font-bold text-gray-900 mb-1">
                        <MapPin className="w-3.5 h-3.5 text-[#1b6b32]" />
                        <span>Delivery in Keelkattalai (20-30 Mins)</span>
                      </div>

                      {/* Full Name */}
                      <div>
                        <input
                          type="text"
                          value={customerName}
                          onChange={(e) => setCustomerName(e.target.value)}
                          placeholder="Your Full Name *"
                          className={`w-full px-3 py-2 rounded-xl text-xs border ${
                            formErrors.name ? 'border-red-500 bg-red-50' : 'border-gray-200'
                          } focus:outline-none focus:ring-2 focus:ring-[#9BE5AA]`}
                        />
                        {formErrors.name && (
                          <p className="text-[11px] text-red-600 mt-0.5">{formErrors.name}</p>
                        )}
                      </div>

                      {/* Phone Number */}
                      <div>
                        <div className="relative flex items-center">
                          <span className="absolute left-3 text-xs font-semibold text-gray-400">
                            +91
                          </span>
                          <input
                            type="tel"
                            maxLength={10}
                            value={customerPhone}
                            onChange={(e) => setCustomerPhone(e.target.value)}
                            placeholder="10-digit Mobile Number *"
                            className={`w-full pl-11 pr-3 py-2 rounded-xl text-xs border ${
                              formErrors.phone ? 'border-red-500 bg-red-50' : 'border-gray-200'
                            } focus:outline-none focus:ring-2 focus:ring-[#9BE5AA]`}
                          />
                        </div>
                        {formErrors.phone && (
                          <p className="text-[11px] text-red-600 mt-0.5">{formErrors.phone}</p>
                        )}
                      </div>

                      {/* Quick Keelkattalai Landmark selector */}
                      <div>
                        <label className="text-[11px] font-semibold text-gray-500 block mb-1">
                          Popular Keelkattalai Landmark (Optional)
                        </label>
                        <select
                          value={selectedLandmark}
                          onChange={(e) => setSelectedLandmark(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl text-xs border border-gray-200 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#9BE5AA]"
                        >
                          <option value="">Select a landmark / street...</option>
                          {SHOP_CONFIG.landmarks.map((lm) => (
                            <option key={lm} value={lm}>
                              {lm}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Delivery Address */}
                      <div>
                        <textarea
                          rows={2}
                          value={deliveryAddress}
                          onChange={(e) => setDeliveryAddress(e.target.value)}
                          placeholder="Door No., Building, Street Name in Keelkattalai *"
                          className={`w-full px-3 py-2 rounded-xl text-xs border ${
                            formErrors.address ? 'border-red-500 bg-red-50' : 'border-gray-200'
                          } focus:outline-none focus:ring-2 focus:ring-[#9BE5AA] resize-none`}
                        />
                        {formErrors.address && (
                          <p className="text-[11px] text-red-600 mt-0.5">{formErrors.address}</p>
                        )}
                      </div>

                      {/* Special cooking instructions */}
                      <div>
                        <input
                          type="text"
                          value={specialNotes}
                          onChange={(e) => setSpecialNotes(e.target.value)}
                          placeholder="Special instructions (e.g. Extra coconut chutney, strong decoction)"
                          className="w-full px-3 py-1.5 rounded-xl text-[11px] border border-gray-200 focus:outline-none focus:ring-2 focus:ring-[#9BE5AA]"
                        />
                      </div>

                      {/* Payment Mode Selector */}
                      <div className="pt-2">
                        <label className="text-[11px] font-bold text-gray-700 block mb-1.5">
                          Payment Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() => setPaymentMode('upi')}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                              paymentMode === 'upi'
                                ? 'border-[#72ca86] bg-[#9BE5AA]/25 text-[#0d3516] font-bold ring-1 ring-[#85d896]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <QrCode className="w-3.5 h-3.5 text-[#1b6b32]" />
                              <span>UPI / QR</span>
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1">GPay, PhonePe, Paytm</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setPaymentMode('cod')}
                            className={`p-2.5 rounded-xl border text-left transition flex flex-col justify-between ${
                              paymentMode === 'cod'
                                ? 'border-[#72ca86] bg-[#9BE5AA]/25 text-[#0d3516] font-bold ring-1 ring-[#85d896]'
                                : 'border-gray-200 text-gray-600 hover:border-gray-300'
                            }`}
                          >
                            <div className="flex items-center gap-1.5 font-bold text-xs">
                              <span className="font-mono text-[#1b6b32]">₹</span>
                              <span>Cash on Delivery</span>
                            </div>
                            <span className="text-[10px] text-gray-500 mt-1">Pay at doorstep</span>
                          </button>
                        </div>
                      </div>

                      {/* Place Order CTA Button */}
                      <button
                        type="submit"
                        className="w-full mt-3 py-3 rounded-xl bg-[#9BE5AA] hover:bg-[#85d896] text-[#0d3516] font-black text-sm uppercase tracking-wider shadow-lg shadow-emerald-500/20 border border-[#85d896] active:scale-[0.98] transition flex items-center justify-center gap-2 cursor-pointer"
                      >
                        <span>Review &amp; Place Order</span>
                        <ChevronRight className="w-4 h-4 text-[#0d3516]" />
                      </button>
                    </form>
                  )}
                </div>

                {/* Stall Assurance Notice */}
                <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100 text-xs text-emerald-800 space-y-1">
                  <div className="flex items-center gap-1.5 font-bold text-emerald-900">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>B+ Coffee Stall Freshness Guarantee</span>
                  </div>
                  <p className="text-[11px] text-emerald-700 leading-relaxed">
                    Filter coffee decoction is freshly extracted every hour. All bajjis and bondas are fried in clean sunflower oil upon order confirmation.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: PYTHON STREAMLIT SCRIPT VIEW (app.py)              */}
        {/* ========================================================= */}
        {activeTab === 'code' && (
          <div className="space-y-6">
            {/* Header info */}
            <div className="bg-white rounded-2xl p-6 border border-gray-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 rounded-md bg-amber-100 text-amber-900 text-xs font-mono font-bold">
                    Single File • app.py
                  </span>
                  <span className="text-xs text-gray-500">Python 3.8+ • Streamlit</span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 mt-1">
                  Streamlit Food Delivery Application Source Code
                </h2>
                <p className="text-xs text-gray-600 mt-0.5">
                  Complete, self-contained, executable script matching all specifications: live cart state, UPI QR code generation, Keelkattalai address validation, and instant WhatsApp dispatch.
                </p>
              </div>

              {/* Action Buttons: Copy & Download */}
              <div className="flex items-center gap-3 w-full md:w-auto">
                <button
                  onClick={handleCopyCode}
                  className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl border border-gray-300 bg-white hover:bg-gray-50 text-gray-800 text-xs font-bold flex items-center justify-center gap-1.5 transition shadow-xs"
                >
                  {codeCopied ? (
                    <>
                      <Check className="w-4 h-4 text-green-600" />
                      <span className="text-green-700">Copied!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4 text-gray-500" />
                      <span>Copy app.py</span>
                    </>
                  )}
                </button>

                <button
                  onClick={handleDownloadPy}
                  className="flex-1 md:flex-initial px-4 py-2.5 rounded-xl bg-[#9BE5AA] hover:bg-[#85d896] text-[#0d3516] text-xs font-black flex items-center justify-center gap-1.5 transition shadow-md shadow-emerald-500/20 border border-[#85d896]"
                >
                  <Download className="w-4 h-4 text-[#0d3516]" />
                  <span>Download app.py</span>
                </button>
              </div>
            </div>

            {/* Quick Terminal Run Instructions */}
            <div className="bg-gray-900 text-gray-100 rounded-2xl p-5 border border-gray-800 shadow-md">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <Code2 className="w-4 h-4 text-[#9BE5AA]" />
                How to Run app.py locally
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs font-mono">
                <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
                  <span className="text-gray-500 select-none"># 1. Install Streamlit</span>
                  <div className="text-[#9BE5AA] mt-1 select-all font-semibold">pip install streamlit</div>
                </div>
                <div className="p-3 bg-black/40 rounded-xl border border-gray-800">
                  <span className="text-gray-500 select-none"># 2. Launch the Web Application</span>
                  <div className="text-[#9BE5AA] mt-1 select-all font-semibold">streamlit run app.py</div>
                </div>
              </div>
              <p className="text-[11px] text-gray-400 mt-3">
                Streamlit will open the interactive dashboard in your browser at <span className="text-emerald-300">http://localhost:8501</span>.
              </p>
            </div>

            {/* Code Box Display */}
            <div className="relative rounded-2xl bg-[#0F172A] border border-gray-800 text-gray-200 overflow-hidden shadow-xl">
              <div className="flex items-center justify-between px-4 py-3 bg-[#1E293B] border-b border-gray-800 text-xs font-mono text-gray-400">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-[#9BE5AA]"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
                  <span className="ml-2 font-bold text-gray-300">app.py</span>
                </div>
                <span>Python 3 Script</span>
              </div>
              <pre className="p-5 text-xs font-mono leading-relaxed overflow-x-auto max-h-[600px] text-gray-300 selection:bg-emerald-900 selection:text-white">
                <code>{PYTHON_APP_CODE}</code>
              </pre>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ABOUT STALL & LOCALITY DETAILS                     */}
        {/* ========================================================= */}
        {activeTab === 'about' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-white rounded-2xl p-6 sm:p-8 border border-gray-200 shadow-xs">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl bg-[#9BE5AA]/30 text-[#0d3516] border border-[#85d896] flex items-center justify-center font-black text-xl">
                  B+
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                    B+ Coffee Shop • Keelkattalai
                  </h2>
                  <p className="text-xs text-gray-500 font-medium">
                    பி+ காபி ஷாப் • Medavakkam Main Road, Keelkattalai, Chennai - 600117
                  </p>
                </div>
              </div>

              <p className="text-sm text-gray-600 leading-relaxed">
                Welcome to B+ Coffee Shop! Located right at the heart of Keelkattalai on Medavakkam Main Road, we have been serving Chennai's authentic Kumbakonam degree filter coffee and piping hot street-style evening snacks.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
                  <Clock className="w-5 h-5 text-[#1b6b32] mb-2" />
                  <h3 className="font-bold text-xs text-gray-900 uppercase">Stall Timings</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    Morning: 6:00 AM – 11:30 AM<br />
                    Evening: 3:30 PM – 9:30 PM<br />
                    <span className="font-semibold text-green-700">Open all 7 days a week</span>
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
                  <Phone className="w-5 h-5 text-emerald-600 mb-2" />
                  <h3 className="font-bold text-xs text-gray-900 uppercase">Direct WhatsApp Order</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    +{SHOP_CONFIG.phone}<br />
                    Live order dispatch &amp; instant tracking confirmation directly with stall master.
                  </p>
                </div>

                <div className="p-4 rounded-xl bg-gray-50 border border-gray-200/80">
                  <QrCode className="w-5 h-5 text-blue-600 mb-2" />
                  <h3 className="font-bold text-xs text-gray-900 uppercase">UPI Payments</h3>
                  <p className="text-xs text-gray-600 mt-1">
                    UPI ID: <span className="font-mono font-semibold">{SHOP_CONFIG.upiId}</span><br />
                    Accepts GPay, PhonePe, Paytm, BHIM, and Cash on Delivery.
                  </p>
                </div>
              </div>

              {/* Delivery Localities in Keelkattalai */}
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-bold text-sm text-gray-900 mb-2">
                  Serving Keelkattalai &amp; Immediate Localities (Within 3 km)
                </h3>
                <div className="flex flex-wrap gap-2 text-xs">
                  {SHOP_CONFIG.landmarks.map((loc) => (
                    <span key={loc} className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium">
                      📍 {loc}
                    </span>
                  ))}
                  <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium">
                    📍 Nanmangalam Lake
                  </span>
                  <span className="px-3 py-1.5 rounded-lg bg-gray-100 text-gray-700 font-medium">
                    📍 Kovilambakkam Junction
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* ORDER CONFIRMATION & WHATSAPP MODAL                      */}
      {/* ========================================================= */}
      {placedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 p-6 sm:p-7 space-y-5">
            {/* Modal Header */}
            <div className="text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                <CheckCircle2 className="w-8 h-8" />
              </div>
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                Order Generated Successfully
              </span>
              <h3 className="text-xl sm:text-2xl font-black text-gray-900 mt-2">
                Order #{placedOrder.orderId}
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                {placedOrder.timestamp} • {SHOP_CONFIG.name}, Keelkattalai
              </p>
            </div>

            {/* Auto WhatsApp Dispatch Banner */}
            <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/90 flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-2 text-emerald-900 font-bold">
                <span className="flex h-2.5 w-2.5 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
                </span>
                <span>Sent automatically to Shop WhatsApp (+{SHOP_CONFIG.phone})</span>
              </div>
              <span className="text-[10px] text-emerald-800 bg-emerald-200/70 px-2.5 py-0.5 rounded-full font-extrabold uppercase tracking-wider">
                Sent
              </span>
            </div>

            {/* UPI Payment Card or COD Details */}
            {placedOrder.paymentMode === 'upi' ? (
              <div className="bg-gray-50 rounded-2xl p-4 border border-dashed border-gray-300 text-center space-y-3">
                <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-gray-800">
                  <QrCode className="w-4 h-4 text-[#1b6b32]" />
                  <span>Scan &amp; Pay ₹{placedOrder.grandTotal.toFixed(2)} with any UPI App</span>
                </div>

                {/* Scannable dynamic QR image */}
                <div className="inline-block p-2 bg-white rounded-xl shadow-sm border border-gray-200">
                  <img
                    src={getUpiUrl(placedOrder.grandTotal, placedOrder.orderId).qrUrl}
                    alt="UPI Payment QR Code"
                    className="w-44 h-44 mx-auto rounded-lg"
                  />
                </div>

                <div className="text-xs text-gray-600 space-y-1">
                  <div className="flex items-center justify-center gap-2">
                    <span className="text-gray-500">UPI ID:</span>
                    <span className="font-mono font-bold text-gray-900">{SHOP_CONFIG.upiId}</span>
                    <button
                      onClick={handleCopyUpi}
                      className="text-[11px] text-[#1b6b32] hover:underline flex items-center gap-0.5 font-bold"
                    >
                      {upiCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                      <span>{upiCopied ? 'Copied' : 'Copy'}</span>
                    </button>
                  </div>
                  <p className="text-[11px] text-gray-400">
                    Supports Google Pay, PhonePe, Paytm, BHIM, Cred
                  </p>
                </div>

                {/* Direct mobile UPI intent link */}
                <div>
                  <a
                    href={getUpiUrl(placedOrder.grandTotal, placedOrder.orderId).uri}
                    className="inline-block text-xs font-bold text-emerald-700 hover:underline"
                  >
                    Open installed UPI App directly 📱
                  </a>
                </div>
              </div>
            ) : (
              <div className="bg-amber-50 rounded-2xl p-4 border border-amber-200 text-xs text-amber-900 flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold">Cash on Delivery Confirmed:</span>
                  <p className="text-amber-800 mt-0.5">
                    Please keep exact cash of <strong>₹{placedOrder.grandTotal.toFixed(2)}</strong> ready at the time of delivery at Keelkattalai.
                  </p>
                </div>
              </div>
            )}

            {/* Structured Itemized Order Receipt */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 text-xs space-y-2">
              <div className="flex items-center justify-between font-bold text-gray-800 pb-2 border-b border-gray-200">
                <span className="flex items-center gap-1.5">
                  <ReceiptText className="w-4 h-4 text-[#1b6b32]" />
                  <span>Order Receipt Details</span>
                </span>
                <span className="text-[11px] text-gray-500">{placedOrder.name}</span>
              </div>

              <div className="space-y-1 pt-1 text-gray-700">
                <p><strong>Deliver to:</strong> {placedOrder.address}</p>
                <p><strong>Contact:</strong> +91 {placedOrder.phone}</p>
              </div>

              <div className="pt-2 border-t border-gray-200 space-y-1">
                {placedOrder.items.map((row) => (
                  <div key={row.item.id} className="flex justify-between text-gray-700">
                    <span>{row.item.name} × {row.qty}</span>
                    <span className="font-semibold">₹{row.subtotal}</span>
                  </div>
                ))}
              </div>

              <div className="pt-2 border-t border-gray-200 space-y-1 font-medium text-gray-600">
                <div className="flex justify-between">
                  <span>Item Total</span>
                  <span>₹{placedOrder.itemTotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span>{placedOrder.deliveryFee === 0 ? 'FREE' : `₹${placedOrder.deliveryFee.toFixed(2)}`}</span>
                </div>
                <div className="flex justify-between">
                  <span>GST (5%)</span>
                  <span>₹{placedOrder.tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-extrabold text-sm text-gray-900 pt-1 border-t border-dashed border-gray-200">
                  <span>Grand Total</span>
                  <span className="text-[#1b6b32] text-base font-black">₹{placedOrder.grandTotal.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* INSTANT WHATSAPP DISPATCH BUTTON */}
            <div className="space-y-2">
              <a
                href={getWhatsAppInfo(placedOrder).url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba5a] text-white font-extrabold text-sm text-center flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/25 transition active:scale-[0.98]"
              >
                <Send className="w-4 h-4" />
                <span>📲 Send Order to Shop WhatsApp</span>
              </a>

              <div className="flex items-center justify-between text-[11px] text-gray-500 px-1">
                <span>Sends pre-formatted receipt to +{SHOP_CONFIG.phone}</span>
                <button
                  onClick={() => handleCopyWhatsAppMsg(getWhatsAppInfo(placedOrder).messageText)}
                  className="text-gray-600 hover:text-black flex items-center gap-1 font-semibold"
                >
                  {msgCopied ? <Check className="w-3 h-3 text-green-600" /> : <Copy className="w-3 h-3" />}
                  <span>{msgCopied ? 'Copied Receipt' : 'Copy Text'}</span>
                </button>
              </div>
            </div>

            {/* Close / Start New Order */}
            <button
              onClick={() => {
                setPlacedOrder(null);
                clearCart();
              }}
              className="w-full py-2.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-bold hover:bg-gray-100 transition"
            >
              Start New Order / Back to Menu
            </button>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="mt-12 bg-white border-t border-gray-200 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 text-xs text-gray-600">
            <div className="space-y-2">
              <div className="flex items-center gap-2 font-black text-gray-900 text-sm">
                <Coffee className="w-4 h-4 text-[#1b6b32]" />
                <span>B+ Coffee Shop</span>
              </div>
              <p className="text-gray-500 leading-relaxed">
                Authentic South Indian Filter Coffee &amp; Crispy Hot Evening Snacks center located in Keelkattalai, Chennai.
              </p>
              <div className="text-[11px] text-gray-400">
                FSSAI Reg. No. 22421548000123
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-gray-900 text-xs block">Stall Location</span>
              <p>{SHOP_CONFIG.fullAddress}</p>
              <p className="text-gray-400">Pin Code: 600117</p>
              <a
                href="https://maps.google.com/?q=Keelkattalai+Chennai"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1 text-[#1b6b32] font-semibold hover:underline mt-1"
              >
                <span>View on Maps</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-gray-900 text-xs block">Stall Timings &amp; Contact</span>
              <p>Morning: 6:00 AM – 11:30 AM</p>
              <p>Evening: 3:30 PM – 9:30 PM</p>
              <p className="font-bold text-emerald-700">Open All 7 Days</p>
              <p>WhatsApp: +{SHOP_CONFIG.phone}</p>
            </div>

            <div className="space-y-1.5">
              <span className="font-bold text-gray-900 text-xs block">Payment &amp; Ordering</span>
              <p>UPI ID: <span className="font-mono font-semibold">{SHOP_CONFIG.upiId}</span></p>
              <p>Payment via GPay / PhonePe / Paytm / COD</p>
              <p className="text-emerald-700 font-semibold">
                Free delivery in Keelkattalai for orders above ₹{SHOP_CONFIG.freeDeliveryThreshold}
              </p>
            </div>
          </div>

          <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
            <div>
              © 2026 B+ Coffee Shop • Keelkattalai, Chennai. All rights reserved.
            </div>
            <div className="flex items-center gap-4">
              <span>Python Streamlit + React Production Build</span>
              <span>•</span>
              <button
                onClick={() => setActiveTab('code')}
                className="text-[#1b6b32] hover:underline font-semibold"
              >
                View app.py Code
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
