import { run, query } from './db.js';
import bcrypt from 'bcryptjs';

const products = [
  // ================== WINTER PRODUCTS ==================
  // Clothing
  {
    season: 'winter',
    category: 'sweaters',
    name: 'Merino Wool Crewneck Sweater',
    description: 'Knitted from 100% fine Merino wool, this crewneck sweater offers exceptional warmth, breathability, and a luxurious soft feel against the skin.',
    price: 2499,
    rating: 4.8,
    images: JSON.stringify(['https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['S', 'M', 'L', 'XL']),
    features: JSON.stringify(['100% Australian Merino Wool', 'Breathable & moisture-wicking', 'Ribbed cuffs and hem', 'Regular fit']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'winter',
    category: 'thermal innerwear',
    name: 'Unisex Thermashield Base Layer Set',
    description: 'Top and bottom matching thermal set designed to lock in body heat. Perfect for layering under everyday wear during extreme cold.',
    price: 1299,
    rating: 4.6,
    images: JSON.stringify(['https://images.unsplash.com/photo-1544441893-675973e31985?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['XS', 'S', 'M', 'L', 'XL', 'XXL']),
    features: JSON.stringify(['Dual-layer thermal weave', 'Flatlock seams to prevent chafing', 'Elastic waistband', 'Poly-spandex stretch blend']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'winter',
    category: 'jackets & coats',
    name: 'Windproof Sherpa Lined Parka',
    description: 'A heavy-duty winter jacket featuring a water-resistant outer shell and high-pile Sherpa fleece lining for maximum warmth.',
    price: 4999,
    rating: 4.9,
    images: JSON.stringify(['https://images.unsplash.com/photo-1548883354-7622d03aca27?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['M', 'L', 'XL']),
    features: JSON.stringify(['Sherpa-lined hood and body', 'Windproof and water-resistant shell', 'Multiple utility pockets', 'Adjustable waist drawcord']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'winter',
    category: 'woolen socks',
    name: 'Premium Woolen Cabin Socks (3-Pack)',
    description: 'Extra thick knit socks made with wool blend to keep your toes warm around the house or inside winter boots.',
    price: 599,
    rating: 4.7,
    images: JSON.stringify(['https://images.unsplash.com/photo-1582966772680-860e372bb558?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['Standard Size']),
    features: JSON.stringify(['Pack of 3 neutral colorways', 'Cushioned footbed', 'Elastic ribbed ankle support', 'Wool-acrylic blend for durability']),
    is_spotlight: 0,
    is_featured: 0
  },
  {
    season: 'winter',
    category: 'beanies & woolen caps',
    name: 'Classic Knit Beanie & Muffler Combo',
    description: 'Keep your neck and ears snug with this matching knit beanie and muffler scarf set, detailed with a subtle leather logo patch.',
    price: 899,
    rating: 4.5,
    images: JSON.stringify(['https://images.unsplash.com/photo-1608231387042-66d1773070a5?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['One Size']),
    features: JSON.stringify(['Matching beanie and scarf', 'Soft acrylic knit (no-itch)', 'Highly stretchable fit', 'Classic cable-knit design']),
    is_spotlight: 0,
    is_featured: 0
  },

  // Accessories
  {
    season: 'winter',
    category: 'electric heating pads',
    name: 'Electric Rapid-Heat Therapy Pad',
    description: 'Soothing heat therapy pad with 6 temperature levels and auto-shutoff. Perfect for relieving winter stiffness and back aches.',
    price: 1499,
    rating: 4.7,
    images: JSON.stringify(['https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['Standard Grid']),
    features: JSON.stringify(['6 temperature settings', '90-minute auto-shutoff timer', 'Machine-washable microplush cover', 'Rapid heating technology']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'winter',
    category: 'thermos & insulated bottles',
    name: 'Double-Walled Insulated Thermos Flask',
    description: 'Keep your chai, coffee, or hot water piping hot for up to 24 hours. Constructed with 18/8 food-grade stainless steel.',
    price: 999,
    rating: 4.8,
    images: JSON.stringify(['https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['750ml', '1000ml']),
    features: JSON.stringify(['Copper-plated inner wall', '24-hour heat retention', 'Leak-proof screw cap operates as cup', 'Sweat-free outer body']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'winter',
    category: 'room heaters (small)',
    name: 'Personal Ceramic Space Heater',
    description: 'Compact oscillating ceramic space heater that warms up personal workspaces instantly and safely.',
    price: 2199,
    rating: 4.4,
    images: JSON.stringify(['https://images.unsplash.com/photo-1614631446501-abcf76949eca?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['Charcoal Black', 'Snow White']),
    features: JSON.stringify(['PTC ceramic heating element', '70-degree auto-oscillation', 'Overheat & tip-over safety switch', 'Silent 45dB operation']),
    is_spotlight: 0,
    is_featured: 0
  },

  // Skincare (Winter Spotlight items)
  {
    season: 'winter',
    category: 'moisturizing creams',
    name: 'Ultra-Rich Barrier Repair Winter Cream',
    description: 'Formulated with Ceramides, Hyaluronic Acid, and Shea Butter to deeply nourish and restore the skin barrier stripped by harsh dry winds.',
    price: 649,
    rating: 4.9,
    images: JSON.stringify(['https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['50ml', '100ml']),
    features: JSON.stringify(['Ceramide NP & AP complex', 'Non-greasy, rich whipped texture', 'Fragrance-free & hypoallergenic', '24-hour moisture lock']),
    usage_instructions: 'Apply a generous amount onto clean, dry skin morning and evening. Gently massage in upward circular motions until fully absorbed. Pay extra attention to dry patches.',
    is_spotlight: 1,
    is_featured: 1
  },
  {
    season: 'winter',
    category: 'lip balms',
    name: 'Shea Butter Deep Nourishing Lip Balm',
    description: 'An ultra-soothing lip treatment that instantly heals chapped lips, creating a protective shield against cold winds.',
    price: 249,
    rating: 4.7,
    images: JSON.stringify(['https://images.unsplash.com/photo-1617897903246-719242758050?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['Classic Shea', 'Warm Vanilla']),
    features: JSON.stringify(['Raw Shea Butter & Vitamin E', 'Natural beeswax base', 'Long-lasting hydration', 'Free of mineral oils']),
    usage_instructions: 'Glide smoothly over lips as often as needed throughout the day, especially before stepping outdoors in cold weather.',
    is_spotlight: 1,
    is_featured: 1
  },
  {
    season: 'winter',
    category: 'hand creams',
    name: 'Ceramide-Infused Hand & Nail Cream',
    description: 'A quick-absorbing, velvety hand lotion that protects frequently washed hands from drying and cracking during winter.',
    price: 349,
    rating: 4.8,
    images: JSON.stringify(['https://images.unsplash.com/photo-1618330834371-decb5b243459?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['75g']),
    features: JSON.stringify(['Cocoa butter and Vitamin E', 'Strengthens cuticles and nails', 'Non-sticky formula', 'Delicate lavender scent']),
    usage_instructions: 'Massage a pea-sized amount into hands and cuticles whenever they feel dry, especially after washing hands.',
    is_spotlight: 1,
    is_featured: 0
  },
  {
    season: 'winter',
    category: 'face oils',
    name: 'Deep-Hydration Rosehip Face Oil',
    description: '100% organic cold-pressed rosehip seed oil. Reinvigorates dull, dry winter skin with antioxidants and essential fatty acids.',
    price: 799,
    rating: 4.6,
    images: JSON.stringify(['https://images.unsplash.com/photo-1608571423902-eed4a5ad8108?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['30ml']),
    features: JSON.stringify(['100% Pure Organic Rosehip Oil', 'Rich in Vitamin A and C', 'Restores natural radiance', 'Cold-pressed extraction']),
    usage_instructions: 'Apply 2-3 drops to face and neck after water-based serums in the evening. Press gently into the skin.',
    is_spotlight: 0,
    is_featured: 0
  },

  // ================== SUMMER PRODUCTS ==================
  // Clothing
  {
    season: 'summer',
    category: 'linen shirts',
    name: 'Breathable Pure Linen Resort Shirt',
    description: 'Stay breezy in the heat with this lightweight, regular-fit linen shirt. Perfect for casual summer outings and beach vacations.',
    price: 1899,
    rating: 4.7,
    images: JSON.stringify(['https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['S', 'M', 'L', 'XL', 'XXL']),
    features: JSON.stringify(['100% Belgian Flax Linen', 'Moisture-absorbent & quick-drying', 'Relaxed camp collar styling', 'Pre-washed for extra softness']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'summer',
    category: 'shorts & bermudas',
    name: 'Lightweight Chino Walk Shorts',
    description: 'Classic chino shorts made with a breathable cotton-stretch blend, hitting just above the knee for maximum comfort.',
    price: 1199,
    rating: 4.5,
    images: JSON.stringify(['https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['30', '32', '34', '36']),
    features: JSON.stringify(['98% Cotton, 2% Elastane', 'Breathable light weave', 'Four pockets design', 'YKK zip fly closure']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'summer',
    category: 'breathable cotton dresses',
    name: 'Floral Cotton Summer Sundress',
    description: 'A flowy, sleeveless dress made with premium organic cotton to keep you cool and stylish on sun-drenched days.',
    price: 2299,
    rating: 4.8,
    images: JSON.stringify(['https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['XS', 'S', 'M', 'L']),
    features: JSON.stringify(['100% Organic Cotton Voile', 'Flowy A-line silhouette', 'Adjustable shoulder straps', 'Breathable cotton lining']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'summer',
    category: 'sunglasses',
    name: 'Polarized Classic Wayfarer Sunglasses',
    description: 'Protect your eyes from strong summer glare with high-definition polarized lenses providing 100% UVA/UVB protection.',
    price: 1499,
    rating: 4.6,
    images: JSON.stringify(['https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['Matte Black', 'Tortoise Shell']),
    features: JSON.stringify(['Triacetate Cellulose polarized lenses', 'Impact-resistant frame', 'UV400 protective coating', 'Includes cleaning pouch and hard case']),
    is_spotlight: 0,
    is_featured: 0
  },

  // Accessories
  {
    season: 'summer',
    category: 'handheld fans & mini fans',
    name: 'Rechargeable Handheld Mist Fan',
    description: 'A portable mini-fan featuring a built-in water mist sprayer to deliver an instant cooling breeze anywhere.',
    price: 799,
    rating: 4.3,
    images: JSON.stringify(['https://images.unsplash.com/photo-1618944847828-82e943c3bedb?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['Pastel Blue', 'Soft Pink']),
    features: JSON.stringify(['3 wind speed levels', 'Ultrasonic fine mist spray', '2000mAh USB rechargeable battery', 'Compact pocketable design']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'summer',
    category: 'water bottles & hydration flasks',
    name: 'Double-Walled Sport Hydration Flask',
    description: 'Vacuum-insulated stainless steel flask with a convenient straw lid to keep your drinks ice-cold for 24 hours.',
    price: 1299,
    rating: 4.8,
    images: JSON.stringify(['https://images.unsplash.com/photo-1523362628745-0c100150b504?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['1000ml']),
    features: JSON.stringify(['Double-walled insulation', 'Leak-proof straw cap', 'Carrying handle loop', 'BPA-free food-grade steel']),
    is_spotlight: 0,
    is_featured: 0
  },

  // Skincare (Summer Spotlight items)
  {
    season: 'summer',
    category: 'sunscreens (spf 30/50)',
    name: 'Broad Spectrum Matte Gel Sunscreen SPF 50',
    description: 'An ultra-light, oil-free gel sunscreen that leaves a clean matte finish with zero white cast. Protects against UVA and UVB rays.',
    price: 499,
    rating: 4.9,
    images: JSON.stringify(['https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['50g', '80g']),
    features: JSON.stringify(['SPF 50 PA++++ protection', 'Non-comedogenic (won’t clog pores)', 'Sweat-resistant matte formula', 'Dermatologist tested']),
    usage_instructions: 'Apply generously to face, neck, and exposed skin 15 minutes before sun exposure. Reapply every 2 hours, or after swimming, sweating, or towel drying.',
    is_spotlight: 1,
    is_featured: 1
  },
  {
    season: 'summer',
    category: 'after-sun gels',
    name: 'Pure Aloe Vera Soothing After-Sun Gel',
    description: 'Enriched with 99% pure organic aloe vera extract. Instantly cools, hydrates, and relieves sun-exposed or mildly sunburned skin.',
    price: 299,
    rating: 4.8,
    images: JSON.stringify(['https://images.unsplash.com/photo-1556229174-5e42a09e45af?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['150g']),
    features: JSON.stringify(['99% pure organic aloe vera', 'Instant cooling effect', 'Non-sticky fast absorption', 'Free of artificial colors and parabens']),
    usage_instructions: 'Apply a generous layer onto clean, sun-exposed skin. Reapply as needed to soothe irritation and dryness. Pro tip: Store in the fridge for extra cooling comfort!',
    is_spotlight: 1,
    is_featured: 1
  },
  {
    season: 'summer',
    category: 'face mists',
    name: 'Cucumber & Rose Hydrating Face Mist',
    description: 'An instant pick-me-up facial spray that cools down hot skin, balances sebum, and locks in lightweight hydration.',
    price: 349,
    rating: 4.7,
    images: JSON.stringify(['https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['100ml']),
    features: JSON.stringify(['Refreshing cucumber extract', 'Steam-distilled pure rose water', 'Alcohol-free formula', 'Fits in your handbag']),
    usage_instructions: 'Hold bottle 6-8 inches away from face, close eyes, and mist evenly onto skin whenever you need a cooling hydration boost.',
    is_spotlight: 1,
    is_featured: 0
  },

  // ================== MONSOON PRODUCTS =================  // Clothing
  {
    season: 'monsoon',
    category: 'raincoats',
    name: 'Breathable Hooded Raincoat',
    description: 'Keep dry with this premium, seam-sealed waterproof raincoat featuring ventilation panels and an adjustable hood.',
    price: 1599,
    rating: 4.7,
    images: JSON.stringify(['https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['S', 'M', 'L', 'XL']),
    features: JSON.stringify(['10000mm waterproof rating', 'Breathable mesh inner lining', 'Seam-sealed zippers', 'Reflective stripes for night visibility']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'monsoon',
    category: 'quick-dry t-shirts & tracks',
    name: 'Dry-Fit Quick-Dry Track Pants',
    description: 'High-performance polyester track pants designed to repel light rain and dry in minutes, making them perfect for monsoon commutes.',
    price: 999,
    rating: 4.4,
    images: JSON.stringify(['https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['S', 'M', 'L', 'XL']),
    features: JSON.stringify(['Moisture-wicking dry-fit tech', 'Repels splashes and light rain', 'Zippered secure pockets', 'Four-way active stretch']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'monsoon',
    category: 'rain boots & waterproof sandals',
    name: 'High-Traction Anti-Slip Rain Boots',
    description: 'Rugged, calf-length rubber boots with deep-groove rubber treads to prevent slipping on mud and wet streets.',
    price: 1899,
    rating: 4.6,
    images: JSON.stringify(['https://images.unsplash.com/photo-1485968579580-b6d095142e6e?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['UK 6', 'UK 7', 'UK 8', 'UK 9', 'UK 10']),
    features: JSON.stringify(['Vulcanized natural rubber structure', 'Anti-slip deep lug soles', 'Quick-dry inner lining', 'Completely waterproof']),
    is_spotlight: 0,
    is_featured: 0
  },

  // Accessories
  {
    season: 'monsoon',
    category: 'umbrellas (rain)',
    name: 'Windproof Double-Canopy Rain Umbrella',
    description: 'A heavy-duty automatic umbrella with a double-canopy venting system that prevents flipping inside out during strong monsoon gusts.',
    price: 749,
    rating: 4.8,
    images: JSON.stringify(['https://images.unsplash.com/photo-1527788263495-31a1ee5d97bc?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['Navy Blue', 'Classic Black']),
    features: JSON.stringify(['Fiberglass rib frame', 'Double-canopy wind vent', 'Auto open-close button', 'Water-repellent Teflon coating']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'monsoon',
    category: 'waterproof bags & backpacks',
    name: 'Roll-Top Waterproof Backpack (25L)',
    description: 'Completely dustproof and waterproof backpack featuring PVC tarpaulin fabric and welded seams. Protects your laptop and books during heavy downpours.',
    price: 2499,
    rating: 4.9,
    images: JSON.stringify(['https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['25L']),
    features: JSON.stringify(['IPX6 waterproof roll-top closure', 'Padded laptop sleeve inside', 'Ergonomic breathable shoulder straps', 'Heavy-duty 500D PVC Tarpaulin']),
    is_spotlight: 0,
    is_featured: 1
  },
  {
    season: 'monsoon',
    category: 'waterproof phone pouches',
    name: 'IPX8 Waterproof Touch-Friendly Phone Pouch',
    description: 'Secure touch-conductive dry bag that lets you use your phone, take photos, and make calls in pouring rain.',
    price: 349,
    rating: 4.5,
    images: JSON.stringify(['https://images.unsplash.com/photo-1546054454-aa26e2b734c7?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['One Size Fits All']),
    features: JSON.stringify(['IPX8 certified up to 30m', 'Highly transparent touch window', 'Secure dual-swivel lock mechanism', 'Includes adjustable neck lanyard']),
    is_spotlight: 0,
    is_featured: 0
  },

  // Skincare (Monsoon Spotlight items)
  {
    season: 'monsoon',
    category: 'anti-fungal foot creams',
    name: 'Anti-Fungal Protective Foot Cream',
    description: 'Formulated with Neem oil, Tea Tree extract, and salicylic acid. Protects feet from fungal infections and odors caused by dirty rainwater.',
    price: 399,
    rating: 4.8,
    images: JSON.stringify(['https://images.unsplash.com/photo-1519735797-402a457224b7?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['50g']),
    features: JSON.stringify(['Contains Neem & Tea Tree oil', 'Prevents athlete’s foot & itching', 'Deodorizing minty freshness', 'Quick-absorb formula']),
    usage_instructions: 'Wash feet thoroughly and dry completely, paying attention to the spaces between toes. Apply the cream generously twice daily, especially before stepping out or after getting feet wet.',
    is_spotlight: 1,
    is_featured: 1
  },
  {
    season: 'monsoon',
    category: 'oil-control face wash',
    name: 'Tea Tree Oil-Control Foaming Face Wash',
    description: 'Mild foaming cleanser that controls excess sebum and fights acne-causing bacteria common in humid monsoon weather.',
    price: 329,
    rating: 4.7,
    images: JSON.stringify(['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['150ml']),
    features: JSON.stringify(['Pure Australian Tea Tree oil', 'Salicylic Acid (BHA) 1%', 'Balances oil-moisture levels', 'Sulfate and paraben-free']),
    usage_instructions: 'Pump foam onto wet palms. Gently massage onto face in circular motions, avoiding the eye area. Rinse thoroughly with lukewarm water. Use morning and night.',
    is_spotlight: 1,
    is_featured: 1
  },
  {
    season: 'monsoon',
    category: 'clay face masks',
    name: 'Purifying Charcoal Clay Face Mask',
    description: 'Activated charcoal and Kaolin clay combine to draw out impurities, pollutants, and excess sebum trapped due to high humidity.',
    price: 449,
    rating: 4.6,
    images: JSON.stringify(['https://images.unsplash.com/photo-1596755389378-7fd0f195856c?w=800&auto=format&fit=crop&q=60']),
    variants: JSON.stringify(['100g']),
    features: JSON.stringify(['Activated Charcoal draws toxins', 'Kaolin clay absorbs excess sebum', 'Nourishing botanical extracts', 'Smoothes and clarifies skin texture']),
    usage_instructions: 'Apply a uniform layer over face and neck, avoiding eyes and lips. Leave on for 10-15 minutes until dry. Rinse off with warm water while massaging gently. Use 1-2 times a week.',
    is_spotlight: 1,
    is_featured: 0
  }
];

const seedDatabase = async () => {
  try {
    // 1. Seed staff accounts
    const staffAccounts = [
      { email: 'owner@sukhira.com', name: 'Sukhira Owner', role: 'owner', pass: 'owner1234' },
      { email: 'manager@sukhira.com', name: 'Sukhira Manager', role: 'manager', pass: 'manager1234' },
      { email: 'staff@sukhira.com', name: 'Sukhira Order Staff', role: 'order_staff', pass: 'staff1234' },
      { email: 'support@sukhira.com', name: 'Sukhira Support Staff', role: 'support', pass: 'support1234' }
    ];

    for (const acc of staffAccounts) {
      const existing = await query("SELECT * FROM users WHERE email = ?", [acc.email]);
      if (existing.length === 0) {
        const passHash = await bcrypt.hash(acc.pass, 10);
        await run(
          "INSERT INTO users (email, password_hash, name, role, status) VALUES (?, ?, ?, ?, ?)",
          [acc.email, passHash, acc.name, acc.role, 'active']
        );
        console.log(`Seeded staff account: ${acc.email} (${acc.role})`);
      }
    }

    // 2. Seed settings
    const settingsCount = await query("SELECT count(*) as count FROM settings");
    if (settingsCount[0].count === 0) {
      const defaultSettings = [
        { key: 'store_name', value: 'Sukhira' },
        { key: 'store_tagline', value: 'Physiology-Driven Seasonal Essentials' },
        { key: 'store_logo', value: '' },
        { key: 'contact_email', value: 'support@sukhira.com' },
        { key: 'contact_phone', value: '+919876543210' },
        { key: 'store_address', value: '123 Dermal lane, Bengaluru, Karnataka, India' },
        { key: 'free_shipping_threshold', value: '1000' },
        { key: 'estimated_delivery_days', value: '5' },
        { key: 'enable_cod', value: '1' },
        { key: 'upi_id', value: 'sukhira@upi' },
        { key: 'card_gateway_key', value: 'pk_test_sukhira_gateway_key_2026' },
        { key: 'shipping_rates', value: JSON.stringify([
          { zone: 'Domestic Standard', rate: 50 },
          { zone: 'Domestic Express', rate: 150 },
          { zone: 'International Standard', rate: 500 }
        ]) },
        { key: 'return_policy', value: 'Items can be returned within 15 days of delivery in their original unused condition with tags intact. Skincare items are non-returnable due to hygiene and health safety protocols.' },
        { key: 'shipping_policy', value: 'Orders are processed within 24-48 business hours. Domestic standard shipping is free for orders above ₹1000. Transit times vary from 3 to 7 business days depending on delivery pincodes.' }
      ];

      for (const s of defaultSettings) {
        await run("INSERT INTO settings (key, value) VALUES (?, ?)", [s.key, s.value]);
      }
      console.log('Seeded default store settings.');
    }

    // 3. Seed FAQs
    const faqsCount = await query("SELECT count(*) as count FROM faqs");
    if (faqsCount[0].count === 0) {
      const defaultFaqs = [
        { question: 'What is the philosophy behind Sukhira?', answer: 'Sukhira aligns your wardrobe and skincare with the changing environmental triggers of Winter, Summer, and Monsoon, supporting your body’s unique physiological adaptations.' },
        { question: 'How can I track my order shipment?', answer: 'Once checked out, you will receive a unique order reference code (e.g. SUK-YYYYMMDD-XXXX). Go to the tracking tab on the top menu and enter the code to inspect its shipping status.' },
        { question: 'What is your return policy for skincare products?', answer: 'For hygiene and safety compliance, skincare gels, face washes, and creams cannot be returned or refunded once opened.' }
      ];

      for (const f of defaultFaqs) {
        await run("INSERT INTO faqs (question, answer) VALUES (?, ?)", [f.question, f.answer]);
      }
      console.log('Seeded default FAQ data.');
    }

    // 4. Seed products (Clean and seed fresh)
    await run('DELETE FROM products');
    console.log('Cleared existing products for fresh seeding.');
    console.log('Seeding products database...');
    if (true) {
      for (const prod of products) {
        await run(
          `INSERT INTO products (season, category, name, description, price, rating, images, variants, features, usage_instructions, is_spotlight, is_featured, stock, min_stock_level, status)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            prod.season,
            prod.category,
            prod.name,
            prod.description,
            prod.price,
            prod.rating,
            prod.images,
            prod.variants,
            prod.features,
            prod.usage_instructions || null,
            prod.is_spotlight,
            prod.is_featured,
            15, // Default stock
            4,  // Default min stock
            'active'
          ]
        );
      }
      console.log('Products seeding completed successfully!');
    } else {
      // Ensure all products have initial stock values populated
      await run("UPDATE products SET stock = 15, min_stock_level = 4, status = 'active' WHERE stock IS NULL");
      console.log('Seeded product stock levels and active status verified.');
    }
  } catch (err) {
    console.error('Error seeding database:', err.message);
  }
};

seedDatabase();
