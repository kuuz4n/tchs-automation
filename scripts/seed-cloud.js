const { createClient } = require('@supabase/supabase-js');

const url = 'https://updupmnyputouwlllxbi.supabase.co';
const key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwZHVwbW55cHV0b3V3bGxseGJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0OTc1ODEsImV4cCI6MjEwNjA3MzU4MX0.HDF_lRHXAjd9csw5FUIuJlLtpZ3b5WILwBQZuXqElVA';
const supabase = createClient(url, key);

async function seedCloud() {
  console.log('Authenticating as admin to seed cloud database...');
  const { data: auth, error: authErr } = await supabase.auth.signInWithPassword({
    email: 'maria.santos@thehappyclub.com',
    password: 'password123',
  });

  if (authErr) {
    console.error('Auth error:', authErr);
    return;
  }
  console.log('✓ Authenticated as:', auth.user.email);

  const cats = [
    {
      id: 'cat-studios',
      name: 'The Cliffhanger Studios',
      description: 'Premier wedding photo & cinematic film production',
      sort_order: 1,
      is_active: true,
    },
    {
      id: 'cat-thc',
      name: 'The Happy Club',
      description: 'Experiential photobooths, party carts & interactive activations',
      sort_order: 2,
      is_active: true,
    },
  ];
  const { error: catErr } = await supabase.from('service_categories').upsert(cats);
  if (catErr) console.error('Cat Error:', catErr);
  else console.log('✓ Service Categories seeded in Supabase.');

  const pkgs = [
    {
      id: 'pkg-sinta-wed',
      category_id: 'cat-studios',
      name: 'Sinta Wedding Day Coverage',
      script_title: 'Sinta',
      subtitle: '| Wedding Day Photo & Video Coverage |',
      short_code: 'PACKAGE A',
      base_price: 24000,
      base_hours: 8,
      base_pax: 150,
      badge_text: '15% OFF',
      description: 'Complete wedding day photo and video documentation from preparation to reception.',
      inclusions: ['Senior Photo & Video Team', 'High-Res Digital Photos', 'Cinematic Highlight Film'],
      freebies: ['Premium Photo Album (8.5x11 / 20 pages / True Flat)', 'Glass-to-Glass Framed Photo (11R / 11x14)'],
      is_active: true,
    },
    {
      id: 'pkg-pb-extended',
      category_id: 'cat-thc',
      name: 'The Happy Club Premium Photobooth - Extended',
      script_title: 'Extended',
      subtitle: 'Interactive High-Speed Photobooth Experience',
      short_code: 'PACKAGE B',
      base_price: 15000,
      base_hours: 4,
      base_pax: 150,
      description: 'Studio lighting, live view DSLR, high-speed dye-sub printouts, and cloud gallery.',
      inclusions: ['Unlimited Prints', 'Custom Border Layout', 'Studio Lighting & Backdrop'],
      freebies: ['Curated Party Props', 'Complimentary Magnetic Photo Sleeves'],
      is_active: true,
    },
    {
      id: 'pkg-pb-classic',
      category_id: 'cat-thc',
      name: 'The Happy Club Premium Photobooth - Classic',
      script_title: 'Classic Photobooth',
      subtitle: 'Special Bundle Add-on',
      base_price: 5400,
      base_hours: 3,
      base_pax: 70,
      badge_text: '10% OFF BUNDLE DISCOUNT',
      description: 'Up to Seventy (70) Pax, 3 hours of photobooth fun.',
      is_active: true,
    },
    {
      id: 'pkg-diy-crafts',
      category_id: 'cat-thc',
      name: 'DIY CRAFTS',
      script_title: 'DIY Crafts',
      subtitle: 'Creative Craft Stations for Events',
      base_price: 8500,
      base_hours: 3,
      base_pax: 100,
      description: 'Interactive craft tables with materials, attendant, and customized event tags.',
      inclusions: [
        '3 Hours Craft Station',
        'Complete Materials & Tools',
        'Dedicated Activity Host',
      ],
      is_active: true,
    },
  ];
  const { error: pkgErr } = await supabase.from('service_packages').upsert(pkgs);
  if (pkgErr) console.error('Pkg Error:', pkgErr);
  else console.log('✓ Service Packages seeded in Supabase.');

  const addons = [
    // Sinta Wedding Day Coverage Addons
    {
      id: 'addon-wed-sde',
      service_id: 'pkg-sinta-wed',
      name: 'Same-Day-Edit (SDE) Video',
      category_tag: 'Video Upgrade',
      pricing_type: 'fixed',
      base_price: 15000,
      description: 'Cinematic highlights edited and screened at dinner',
      is_active: true,
    },
    {
      id: 'addon-wed-drone',
      service_id: 'pkg-sinta-wed',
      name: 'Aerial Drone Cinema',
      category_tag: 'Video Upgrade',
      pricing_type: 'fixed',
      base_price: 7500,
      description: '4K aerial shots of ceremony & venue',
      is_active: true,
    },
    {
      id: 'addon-wed-prenup',
      service_id: 'pkg-sinta-wed',
      name: 'Pre-Nup Photo Session',
      category_tag: 'Photo Upgrade',
      pricing_type: 'fixed',
      base_price: 12000,
      description: 'Half-day photo session with 25 curated retouched photos',
      is_active: true,
    },

    // Photobooth Addons
    {
      id: 'addon-sintra-props',
      service_id: 'pkg-pb-extended',
      name: 'Sintra Props',
      category_tag: 'Props',
      pricing_type: 'interval',
      base_price: 350,
      interval_unit: 'pc',
      interval_step: 1,
      description: 'Custom die-cut Sintra board handheld props',
      is_active: true,
    },
    {
      id: 'addon-magnetic-prints',
      service_id: 'pkg-pb-extended',
      name: 'Magnetic Prints',
      category_tag: 'Print Upgrade',
      pricing_type: 'fixed',
      base_price: 2000,
      description: 'Full magnetic backing strip for all prints',
      is_active: true,
    },
    {
      id: 'addon-pb-hours',
      service_id: 'pkg-pb-extended',
      name: 'Additional Hours',
      category_tag: 'Duration',
      pricing_type: 'interval',
      base_price: 2500,
      interval_unit: 'HOUR',
      interval_step: 1,
      description: 'Extended photobooth operation per hour',
      is_active: true,
    },
    {
      id: 'addon-giveaway-stickers',
      service_id: 'pkg-pb-extended',
      name: 'Giveaway Stickers (100-200 pcs)',
      category_tag: 'Giveaway',
      pricing_type: 'fixed',
      base_price: 1800,
      description: 'Custom themed stickers pack',
      is_active: true,
    },

    // DIY Crafts Addons
    {
      id: 'addon-diy-sintra',
      service_id: 'pkg-diy-crafts',
      name: 'Sintra Props',
      category_tag: 'Props',
      pricing_type: 'interval',
      base_price: 350,
      interval_unit: 'pc',
      interval_step: 1,
      description: 'Custom crafted props and signs',
      is_active: true,
    },
    {
      id: 'addon-diy-attendant',
      service_id: 'pkg-diy-crafts',
      name: 'Additional Craft Attendant',
      category_tag: 'Staffing',
      pricing_type: 'fixed',
      base_price: 2500,
      description: 'Extra friendly attendant for high-volume crowds',
      is_active: true,
    },
    {
      id: 'addon-diy-decals',
      service_id: 'pkg-diy-crafts',
      name: 'Custom Cart Decals & Branding',
      category_tag: 'Branding',
      pricing_type: 'fixed',
      base_price: 2000,
      description: 'Full vinyl personalized cart decal design & installation',
      is_active: true,
    },
    {
      id: 'addon-diy-materials',
      service_id: 'pkg-diy-crafts',
      name: 'Additional 50 Pax Materials',
      category_tag: 'Supplies',
      pricing_type: 'interval',
      base_price: 3500,
      interval_unit: 'PAX',
      interval_step: 50,
      description: 'Extra materials and craft packs for 50 additional guests',
      is_active: true,
    },
  ];
  const { error: addErr } = await supabase.from('addons').upsert(addons);
  if (addErr) console.error('Addon Error:', addErr);
  else console.log('✓ All Add-ons seeded in Supabase.');

  console.log('Seeding fully finished!');
}

seedCloud();
