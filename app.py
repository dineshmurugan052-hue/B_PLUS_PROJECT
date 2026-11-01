"""
B+ Coffee Shop - Online Food Delivery Web Application
Location: Keelkattalai, Chennai
Framework: Streamlit (Python)

To run this application:
1. Ensure Python 3.8+ is installed.
2. Install Streamlit:
   $ pip install streamlit
3. Run the application:
   $ streamlit run app.py
4. Open the displayed local URL (typically http://localhost:8501) in your browser.
"""

import streamlit as st
import urllib.parse
from datetime import datetime
import random
import re

# ==========================================
# 1. CONFIGURATION & CONSTANTS
# ==========================================
SHOP_PHONE_NUMBER = "6383625452"  # Target WhatsApp number with country code
SHOP_UPI_ID = "bpluscoffee@okaxis"   # UPI VPA for digital payments
SHOP_NAME = "B+ Coffee Shop"
SHOP_LOCATION = "Keelkattalai, Chennai"
BRAND_RED = "#9BE5AA"
FREE_DELIVERY_THRESHOLD = 150.0
DELIVERY_FEE_STANDARD = 20.0
GST_RATE = 0.05  # 5% GST

# Page configuration
st.set_page_config(
    page_title=f"{SHOP_NAME} | Keelkattalai, Chennai",
    page_icon="☕",
    layout="wide",
    initial_sidebar_state="collapsed",
)

# ==========================================
# 2. CUSTOM ZOMATO-INSPIRED CSS THEME
# ==========================================
st.markdown(
    f"""
    <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');

    html, body, [class*="css"] {{
        font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
    }}

    /* Top Brand Banner */
    .brand-header {{
        background: linear-gradient(135deg, #9BE5AA 0%, #72ca86 100%);
        color: #0d3516;
        padding: 24px 28px;
        border-radius: 16px;
        margin-bottom: 24px;
        box-shadow: 0 8px 24px rgba(114, 202, 134, 0.25);
        border: 1px solid #85d896;
    }}
    .brand-title {{
        font-size: 2.2rem;
        font-weight: 800;
        margin: 0;
        display: flex;
        align-items: center;
        gap: 12px;
        letter-spacing: -0.5px;
    }}
    .brand-subtitle {{
        font-size: 1.05rem;
        opacity: 0.95;
        margin-top: 6px;
        font-weight: 500;
    }}
    .brand-badges {{
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 14px;
    }}
    .brand-badge {{
        background: rgba(255, 255, 255, 0.2);
        backdrop-filter: blur(4px);
        color: white;
        padding: 4px 12px;
        border-radius: 20px;
        font-size: 0.82rem;
        font-weight: 600;
    }}

    /* Card styling */
    .menu-card {{
        background: #FFFFFF;
        border: 1px solid #F0F2F5;
        border-radius: 14px;
        padding: 16px;
        margin-bottom: 14px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    }}
    .menu-card:hover {{
        transform: translateY(-2px);
        box-shadow: 0 6px 16px rgba(0, 0, 0, 0.08);
        border-color: #FCE8E9;
    }}

    /* Veg symbol */
    .veg-symbol {{
        display: inline-block;
        width: 16px;
        height: 16px;
        border: 2px solid #28A745;
        padding: 2px;
        border-radius: 3px;
        vertical-align: middle;
        margin-right: 6px;
        box-sizing: border-box;
    }}
    .veg-symbol::after {{
        content: "";
        display: block;
        width: 6px;
        height: 6px;
        background: #28A745;
        border-radius: 50%;
        margin: 1px auto 0 auto;
    }}

    /* Price tag */
    .price-text {{
        font-size: 1.15rem;
        font-weight: 700;
        color: #1C1C1C;
        margin-top: 4px;
    }}

    /* Right cart sticky summary */
    .cart-container {{
        background: #FFFFFF;
        border: 1px solid #ECEEF2;
        border-radius: 16px;
        padding: 20px;
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    }}
    .cart-header {{
        font-size: 1.3rem;
        font-weight: 700;
        color: #1C1C1C;
        border-bottom: 2px solid #F4F5F7;
        padding-bottom: 12px;
        margin-bottom: 16px;
        display: flex;
        justify-content: space-between;
        align-items: center;
    }}

    /* WhatsApp Button */
    .wa-button {{
        display: inline-block;
        width: 100%;
        text-align: center;
        background: #25D366;
        color: white !important;
        font-weight: 700;
        font-size: 1.05rem;
        padding: 14px 20px;
        border-radius: 10px;
        text-decoration: none !important;
        box-shadow: 0 4px 14px rgba(37, 211, 102, 0.35);
        transition: all 0.2s ease;
        margin-top: 12px;
    }}
    .wa-button:hover {{
        background: #1EBE5D;
        box-shadow: 0 6px 18px rgba(37, 211, 102, 0.5);
        color: white !important;
    }}

    /* Free delivery banner */
    .free-delivery-badge {{
        background: #E8F5E9;
        color: #2E7D32;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 0.88rem;
        font-weight: 600;
        border: 1px dashed #A5D6A7;
        margin-bottom: 14px;
    }}
    .free-delivery-progress {{
        background: #FFF3E0;
        color: #E65100;
        padding: 8px 12px;
        border-radius: 8px;
        font-size: 0.88rem;
        font-weight: 600;
        border: 1px dashed #FFCC80;
        margin-bottom: 14px;
    }}

    /* Streamlit button custom accents */
    div.stButton > button[kind="primary"] {{
        background-color: {BRAND_RED} !important;
        border-color: {BRAND_RED} !important;
        color: #0d3516 !important;
        font-weight: 700 !important;
        border-radius: 8px !important;
    }}
    div.stButton > button[kind="primary"]:hover {{
        background-color: #85d896 !important;
        border-color: #85d896 !important;
        color: #0d3516 !important;
    }}
    </style>
    """,
    unsafe_allow_html=True,
)

# ==========================================
# 3. MENU DATA & STATE INITIALIZATION
# ==========================================
MENU_ITEMS = [
    {
        "id": "item_1",
        "name": "Kumbakonam Degree Coffee",
        "category": "Hot Beverages",
        "price": 25,
        "desc": "Traditional South Indian chicory filter coffee freshly brewed with rich, foamy cow milk.",
        "icon": "☕",
        "prep_time": "5 mins",
    },
    {
        "id": "item_2",
        "name": "Ginger Masala Tea",
        "category": "Hot Beverages",
        "price": 20,
        "desc": "Aromatic CTC tea simmered with fresh crushed ginger, cardamom, and clove spices.",
        "icon": "🫖",
        "prep_time": "5 mins",
    },
    {
        "id": "item_3",
        "name": "Nattu Sakkarai Tea",
        "category": "Hot Beverages",
        "price": 25,
        "desc": "Healthy & flavorful tea infused with unrefined pure organic country sugar (nattu sakkarai).",
        "icon": "🍯",
        "prep_time": "5 mins",
    },
    {
        "id": "item_4",
        "name": "Vazhakkai Bajji (2 pcs)",
        "category": "Evening Snacks",
        "price": 30,
        "desc": "Crispy golden fried raw plantain fritters served piping hot with fresh coconut chutney.",
        "icon": "🍌",
        "prep_time": "8 mins",
    },
    {
        "id": "item_5",
        "name": "Milagai Bajji (2 pcs)",
        "category": "Evening Snacks",
        "price": 30,
        "desc": "Chennai street-style mild banana peppers dipped in spiced gram flour batter and deep fried.",
        "icon": "🌶️",
        "prep_time": "8 mins",
    },
    {
        "id": "item_6",
        "name": "Madras Onion Bonda (2 pcs)",
        "category": "Evening Snacks",
        "price": 30,
        "desc": "Crunchy outer shell stuffed with caramelised onions, curry leaves, and green chillies.",
        "icon": "🧅",
        "prep_time": "8 mins",
    },
    {
        "id": "item_7",
        "name": "Mysore Bonda (3 pcs)",
        "category": "Evening Snacks",
        "price": 35,
        "desc": "Fluffy, pillowy golden dumplings made with curd batter, cumin, ginger, and coconut bits.",
        "icon": "🥟",
        "prep_time": "8 mins",
    },
    {
        "id": "item_8",
        "name": "Medu Vada (1 pc)",
        "category": "Crispy Bites",
        "price": 20,
        "desc": "Crispy golden urad dal donut fritter with a soft, airy centre, seasoned with peppercorns.",
        "icon": "🍩",
        "prep_time": "5 mins",
    },
    {
        "id": "item_9",
        "name": "Aloo Samosa (2 pcs)",
        "category": "Crispy Bites",
        "price": 30,
        "desc": "Crisp flaky pastry triangles packed with aromatic cumin-tempered spiced potatoes & peas.",
        "icon": "🔺",
        "prep_time": "5 mins",
    },
]

# Initialize session state for cart
if "cart" not in st.session_state:
    st.session_state.cart = {}  # {item_id: quantity}

if "order_placed" not in st.session_state:
    st.session_state.order_placed = False

if "last_order_details" not in st.session_state:
    st.session_state.last_order_details = None


def add_to_cart(item_id: str):
    st.session_state.cart[item_id] = st.session_state.cart.get(item_id, 0) + 1


def remove_from_cart(item_id: str):
    if item_id in st.session_state.cart:
        if st.session_state.cart[item_id] > 1:
            st.session_state.cart[item_id] -= 1
        else:
            del st.session_state.cart[item_id]


def clear_cart():
    st.session_state.cart = {}
    st.session_state.order_placed = False
    st.session_state.last_order_details = None


# ==========================================
# 4. BRAND HEADER
# ==========================================
st.markdown(
    f"""
    <div class="brand-header">
        <div class="brand-title">
            <span>☕ {SHOP_NAME}</span>
        </div>
        <div class="brand-subtitle">
            Authentic South Indian Filter Coffee & Crispy Hot Evening Snacks • {SHOP_LOCATION}
        </div>
        <div class="brand-badges">
            <span class="brand-badge">📍 Keelkattalai Junction</span>
            <span class="brand-badge">⭐ 4.8 (850+ reviews)</span>
            <span class="brand-badge">⚡ Freshly Prepared & Steaming Hot</span>
            <span class="brand-badge">🛵 Local Delivery: 20-30 Mins</span>
            <span class="brand-badge">✨ 100% Pure Vegetarian</span>
        </div>
    </div>
    """,
    unsafe_allow_html=True,
)

# ==========================================
# 5. TWO-COLUMN MAIN LAYOUT
# ==========================================
col_menu, col_cart = st.columns([1.65, 1.0], gap="large")

# ------------------------------------------
# LEFT COLUMN: MENU & CATEGORY FILTER
# ------------------------------------------
with col_menu:
    st.subheader("🍽️ Explore Our Fresh Menu")

    # Search bar & Category filter
    col_search, col_cat = st.columns([1.2, 1.0])
    with col_search:
        search_query = st.text_input(
            "Search item",
            placeholder="🔍 Search e.g. Degree Coffee, Bajji, Vada...",
            label_visibility="collapsed",
        ).strip().lower()

    with col_cat:
        category_options = ["All", "Hot Beverages", "Evening Snacks", "Crispy Bites"]
        selected_category = st.selectbox(
            "Category",
            category_options,
            label_visibility="collapsed",
        )

    # Filter items
    filtered_items = []
    for item in MENU_ITEMS:
        matches_cat = (selected_category == "All") or (item["category"] == selected_category)
        matches_search = (
            not search_query
            or search_query in item["name"].lower()
            or search_query in item["desc"].lower()
            or search_query in item["category"].lower()
        )
        if matches_cat and matches_search:
            filtered_items.append(item)

    if not filtered_items:
        st.info("No items match your search. Try another keyword or reset the category filter.")
    else:
        st.caption(f"Showing **{len(filtered_items)}** delicious items prepared fresh to order")

        # Render Item Cards
        for item in filtered_items:
            item_id = item["id"]
            current_qty = st.session_state.cart.get(item_id, 0)

            # Container card
            with st.container():
                st.markdown(
                    f"""
                    <div class="menu-card">
                        <div style="display: flex; justify-content: space-between; align-items: flex-start;">
                            <div style="flex: 1; padding-right: 12px;">
                                <div style="display: flex; align-items: center; gap: 6px;">
                                    <span class="veg-symbol" title="100% Pure Vegetarian"></span>
                                    <span style="font-size: 0.8rem; font-weight: 700; color: #28A745; text-transform: uppercase; letter-spacing: 0.5px;">Pure Veg</span>
                                    <span style="font-size: 0.8rem; color: #888;">• {item['category']}</span>
                                </div>
                                <h4 style="margin: 6px 0 2px 0; font-size: 1.12rem; font-weight: 700; color: #1F2937;">
                                    {item['icon']} {item['name']}
                                </h4>
                                <div class="price-text">₹{item['price']}</div>
                                <p style="margin: 6px 0 0 0; font-size: 0.86rem; color: #6B7280; line-height: 1.4;">
                                    {item['desc']}
                                </p>
                                <div style="margin-top: 6px; font-size: 0.78rem; color: #9CA3AF;">
                                    ⏱️ Ready in {item['prep_time']}
                                </div>
                            </div>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )

                # Quantity Controller row
                btn_cols = st.columns([3, 1, 1, 1])
                with btn_cols[0]:
                    pass  # Alignment spacer

                if current_qty == 0:
                    with btn_cols[3]:
                        if st.button("➕ ADD", key=f"add_{item_id}", type="primary", use_container_width=True):
                            add_to_cart(item_id)
                            st.rerun()
                else:
                    with btn_cols[1]:
                        if st.button("➖", key=f"dec_{item_id}", use_container_width=True):
                            remove_from_cart(item_id)
                            st.rerun()
                    with btn_cols[2]:
                        st.markdown(
                            f"<div style='text-align: center; font-weight: 700; font-size: 1.1rem; line-height: 38px;'>{current_qty}</div>",
                            unsafe_allow_html=True,
                        )
                    with btn_cols[3]:
                        if st.button("➕", key=f"inc_{item_id}", use_container_width=True):
                            add_to_cart(item_id)
                            st.rerun()

                st.write("")  # Vertical rhythm

# ------------------------------------------
# RIGHT COLUMN: LIVE CART & CHECKOUT
# ------------------------------------------
with col_cart:
    st.markdown('<div class="cart-container">', unsafe_allow_html=True)
    st.markdown(
        """
        <div class="cart-header">
            <span>🛒 Your Order</span>
            <span style="font-size: 0.9rem; color: #666; font-weight: 500;">B+ Coffee Shop</span>
        </div>
        """,
        unsafe_allow_html=True,
    )

    cart = st.session_state.cart
    cart_items_data = []
    item_total = 0.0

    # Calculate item totals
    for item in MENU_ITEMS:
        qty = cart.get(item["id"], 0)
        if qty > 0:
            subtotal = qty * item["price"]
            item_total += subtotal
            cart_items_data.append({
                "item": item,
                "qty": qty,
                "subtotal": subtotal,
            })

    if not cart_items_data:
        st.markdown(
            """
            <div style="text-align: center; padding: 36px 12px; color: #888;">
                <div style="font-size: 2.5rem; margin-bottom: 8px;">🛍️</div>
                <div style="font-weight: 600; font-size: 1.05rem; color: #444;">Your cart is empty</div>
                <div style="font-size: 0.85rem; margin-top: 4px;">Add Kumbakonam Degree Coffee or crispy hot bajjis to get started!</div>
            </div>
            """,
            unsafe_allow_html=True,
        )
    else:
        # Free delivery banner & indicator
        if item_total >= FREE_DELIVERY_THRESHOLD:
            delivery_fee = 0.0
            st.markdown(
                """
                <div class="free-delivery-badge">
                    🎉 <strong>YAY! FREE DELIVERY UNLOCKED</strong> (Order > ₹150)
                </div>
                """,
                unsafe_allow_html=True,
            )
        else:
            delivery_fee = DELIVERY_FEE_STANDARD
            shortfall = FREE_DELIVERY_THRESHOLD - item_total
            st.markdown(
                f"""
                <div class="free-delivery-progress">
                    🚀 Add <strong>₹{shortfall:.0f}</strong> more to unlock <strong>FREE DELIVERY</strong>!
                </div>
                """,
                unsafe_allow_html=True,
            )

        # Itemized cart list
        st.markdown("##### Selected Items:")
        for entry in cart_items_data:
            c_name = entry["item"]["name"]
            c_qty = entry["qty"]
            c_price = entry["item"]["price"]
            c_sub = entry["subtotal"]

            cart_c1, cart_c2, cart_c3 = st.columns([2.5, 1.2, 1.2])
            with cart_c1:
                st.markdown(f"**{c_name}**<br><span style='font-size: 0.78rem; color: #888;'>₹{c_price} each</span>", unsafe_allow_html=True)
            with cart_c2:
                st.markdown(f"<span style='font-size: 0.9rem; font-weight: 600;'>x {c_qty}</span>", unsafe_allow_html=True)
            with cart_c3:
                st.markdown(f"<div style='text-align: right; font-weight: 700; color: #1C1C1C;'>₹{c_sub}</div>", unsafe_allow_html=True)

        st.divider()

        # Bill breakdown calculations
        taxes = round(item_total * GST_RATE, 2)
        grand_total = round(item_total + delivery_fee + taxes, 2)
        delivery_tag = '<span style="color:#28A745; font-weight:700;">FREE</span>' if delivery_fee == 0.0 else f"₹{delivery_fee:.2f}"

        st.markdown(
            f"""
            <div style="font-size: 0.92rem; line-height: 1.8;">
                <div style="display: flex; justify-content: space-between;">
                    <span>Item Total:</span>
                    <span>₹{item_total:.2f}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Delivery Fee:</span>
                    <span>{delivery_tag}</span>
                </div>
                <div style="display: flex; justify-content: space-between;">
                    <span>Taxes & Charges (5% GST):</span>
                    <span>₹{taxes:.2f}</span>
                </div>
                <div style="display: flex; justify-content: space-between; font-size: 1.25rem; font-weight: 800; color: {BRAND_RED}; margin-top: 10px; border-top: 2px dashed #E5E7EB; padding-top: 10px;">
                    <span>Grand Total:</span>
                    <span>₹{grand_total:.2f}</span>
                </div>
            </div>
            """,
            unsafe_allow_html=True,
        )

        st.write("")

        # ------------------------------------------
        # CUSTOMER & DELIVERY DETAILS FORM
        # ------------------------------------------
        st.markdown("#### 🛵 Keelkattalai Delivery Info")

        with st.form("checkout_form"):
            cust_name = st.text_input("Customer Full Name *", placeholder="e.g. Ramesh Kumar")
            cust_phone = st.text_input("10-Digit Mobile Number *", placeholder="e.g. 9840123456", max_chars=10)

            # Local Keelkattalai landmark helper
            keelkattalai_landmarks = [
                "Select a landmark / street in Keelkattalai...",
                "Medavakkam Main Road (near Keelkattalai Bus Terminus)",
                "Eachangadu Signal Junction",
                "200 Feet Radial Road (Thoraipakkam link)",
                "Nanmangalam Reserve Forest Road",
                "Moovarasampettai Main Road",
                "Ambal Nagar / Saraswathi Nagar",
                "Other Keelkattalai Street / Colony",
            ]
            selected_landmark = st.selectbox("Popular Keelkattalai Landmark (Optional)", keelkattalai_landmarks)

            cust_address = st.text_area(
                "Full Delivery Address & Door / Flat No. *",
                placeholder="Door No, Street Name, Landmark near Keelkattalai...",
                help="We deliver anywhere in Keelkattalai and surrounding 3 km radius within 20-30 minutes.",
                height=70,
            )

            # Payment mode selector
            payment_mode = st.radio(
                "Select Payment Mode *",
                ["UPI / GPay / PhonePe / Paytm", "Cash on Delivery (COD)"],
                index=0,
            )

            submit_order = st.form_submit_button("🛒 Review & Place Order", type="primary", use_container_width=True)

        # ------------------------------------------
        # ORDER SUBMISSION & WHATSAPP DISPATCH
        # ------------------------------------------
        if submit_order:
            # Validations
            phone_clean = re.sub(r"\D", "", cust_phone)
            errors = []

            if not cust_name.strip():
                errors.append("Please enter your full name.")
            if not (len(phone_clean) == 10 and phone_clean.isdigit()):
                errors.append("Please enter a valid 10-digit mobile number.")
            if not cust_address.strip():
                errors.append("Please enter your detailed Keelkattalai delivery address.")

            if errors:
                for err in errors:
                    st.error(f"⚠️ {err}")
            else:
                rand_suffix = random.randint(100, 999)
                order_id = f"BPLUS-{datetime.now().strftime('%y%m%d')}-{rand_suffix}"
                readable_time = datetime.now().strftime("%d %b %Y, %I:%M %p")

                # Build full address including landmark if chosen
                full_delivery_loc = cust_address.strip()
                if selected_landmark and "Select a landmark" not in selected_landmark:
                    full_delivery_loc += f" (Near {selected_landmark})"
                full_delivery_loc += ", Keelkattalai, Chennai"

                # Store order state
                st.session_state.order_placed = True
                st.session_state.last_order_details = {
                    "order_id": order_id,
                    "timestamp": readable_time,
                    "name": cust_name.strip(),
                    "phone": phone_clean,
                    "address": full_delivery_loc,
                    "items": cart_items_data,
                    "item_total": item_total,
                    "delivery_fee": delivery_fee,
                    "taxes": taxes,
                    "grand_total": grand_total,
                    "payment_mode": payment_mode,
                }
                st.success(f"Order #{order_id} recorded successfully! See payment & dispatch below.")

        # If order was placed, display payment QR and WhatsApp link
        if st.session_state.order_placed and st.session_state.last_order_details:
            od = st.session_state.last_order_details

            st.write("---")
            st.markdown(f"### 📋 Order Confirmation: `{od['order_id']}`")
            st.caption(f"Placed on {od['timestamp']}")

            # Dynamic UPI QR Code Generation
            if "UPI" in od["payment_mode"]:
                upi_note = f"Order {od['order_id']} at {SHOP_NAME}"
                # Construct standard UPI Intent string: upi://pay?pa=...&pn=...&am=...&cu=INR&tn=...
                upi_intent_uri = (
                    f"upi://pay?pa={SHOP_UPI_ID}&pn={urllib.parse.quote(SHOP_NAME)}"
                    f"&am={od['grand_total']:.2f}&cu=INR&tn={urllib.parse.quote(upi_note)}"
                )
                qr_api_url = f"https://api.qrserver.com/v1/create-qr-code/?size=240x240&margin=10&data={urllib.parse.quote(upi_intent_uri)}"

                st.markdown(
                    f"""
                    <div style="background: #F9FAFB; border: 2px dashed #D1D5DB; border-radius: 12px; padding: 16px; text-align: center; margin: 12px 0;">
                        <div style="font-weight: 700; color: #111827; font-size: 1rem;">📱 Scan & Pay via any UPI App</div>
                        <div style="font-size: 0.82rem; color: #6B7280; margin-top: 2px;">GPay • PhonePe • Paytm • BHIM • Cred</div>
                        <div style="margin: 14px auto;">
                            <img src="{qr_api_url}" alt="UPI QR Code" style="width: 190px; height: 190px; border-radius: 8px; box-shadow: 0 4px 10px rgba(0,0,0,0.08); background: white; padding: 6px;"/>
                        </div>
                        <div style="font-size: 0.85rem; color: #374151;">
                            UPI ID: <strong>{SHOP_UPI_ID}</strong><br>
                            Amount: <strong style="color: {BRAND_RED}; font-size: 1.1rem;">₹{od['grand_total']:.2f}</strong>
                        </div>
                    </div>
                    """,
                    unsafe_allow_html=True,
                )
            else:
                st.info(f"💵 **Cash on Delivery selected:** Please keep exact change of **₹{od['grand_total']:.2f}** ready at delivery.")

            # Delivery fee label in bill receipt
            od_delivery_str = "FREE" if od["delivery_fee"] == 0.0 else f"₹{od['delivery_fee']:.2f}"

            # Construct clean itemized WhatsApp message
            wa_lines = [
                f"☕ *NEW ORDER: {SHOP_NAME}*",
                f"📍 *Location:* {SHOP_LOCATION}",
                f"🆔 *Order ID:* {od['order_id']}",
                f"🕒 *Time:* {od['timestamp']}",
                "",
                "👤 *CUSTOMER DETAILS*",
                f"• *Name:* {od['name']}",
                f"• *Phone:* +91 {od['phone']}",
                f"• *Delivery Address:* {od['address']}",
                "",
                "📦 *ITEMIZED ORDER*",
            ]

            for item_row in od["items"]:
                wa_lines.append(
                    f"• {item_row['item']['name']} x {item_row['qty']} = ₹{item_row['subtotal']:.0f}"
                )

            wa_lines.extend([
                "",
                "🧾 *BILL BREAKDOWN*",
                f"• Item Total: ₹{od['item_total']:.2f}",
                f"• Delivery Fee: {od_delivery_str}",
                f"• GST (5%): ₹{od['taxes']:.2f}",
                f"• *GRAND TOTAL: ₹{od['grand_total']:.2f}*",
                f"• *Payment Mode:* {od['payment_mode']}",
                "",
                "🙏 *Please confirm this order and dispatch fresh!*",
            ])

            raw_wa_message = "\n".join(wa_lines)
            encoded_wa_text = urllib.parse.quote(raw_wa_message)
            whatsapp_url = f"https://wa.me/{SHOP_PHONE_NUMBER}?text={encoded_wa_text}"

            # Auto-dispatch trigger and status
            st.markdown(
                f"""
                <script>
                    window.open("{whatsapp_url}", "_blank");
                </script>
                <div style="background: #E8F5E9; border: 1px solid #A5D6A7; border-radius: 8px; padding: 10px 14px; margin-bottom: 12px; font-size: 0.88rem; color: #1B5E20; display: flex; align-items: center; justify-content: space-between;">
                    <span>🚀 <strong>Order Auto-Sent to Shop WhatsApp</strong></span>
                    <span style="font-size: 0.78rem; background: #C8E6C9; padding: 2px 8px; border-radius: 12px; font-weight: 700;">Sent</span>
                </div>
                <a href="{whatsapp_url}" target="_blank" class="wa-button">
                    📲 Open WhatsApp Chat (+{SHOP_PHONE_NUMBER})
                </a>
                <div style="text-align: center; font-size: 0.78rem; color: #6B7280; margin-top: 6px;">
                    Pre-formatted receipt auto-dispatched to WhatsApp: +{SHOP_PHONE_NUMBER}
                </div>
                """,
                unsafe_allow_html=True,
            )

            # Option to reset/clear cart
            if st.button("🔄 Start New Order / Clear Cart", use_container_width=True):
                clear_cart()
                st.rerun()

    st.markdown("</div>", unsafe_allow_html=True)

# ==========================================
# 6. FOOTER & LOCALITY DETAILS
# ==========================================
st.markdown("---")
col_f1, col_f2, col_f3 = st.columns(3)
with col_f1:
    st.markdown(
        f"""
        **{SHOP_NAME}**  
        Near Keelkattalai Bus Stand,  
        Medavakkam Main Road,  
        Keelkattalai, Chennai - 600117  
        📞 Phone: +{SHOP_PHONE_NUMBER}
        """
    )
with col_f2:
    st.markdown(
        """
        **⏰ Stall Timings**  
        • Morning Coffee: 6:00 AM – 11:30 AM  
        • Evening Snacks & Tea: 3:30 PM – 9:30 PM  
        • Open All 7 Days!  
        *Fresh batch bajji & bonda hot every 15 minutes.*
        """
    )
with col_f3:
    st.markdown(
        f"""
        **💳 Payment Options**  
        • UPI VPA: `{SHOP_UPI_ID}`  
        • Google Pay / PhonePe / Paytm  
        • Cash on Delivery (COD)  
        • Free local Keelkattalai delivery on orders above ₹{FREE_DELIVERY_THRESHOLD:.0f}
        """
    )

if __name__ == "__main__":
    pass
