const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
const ws = require('ws');

// Read env file manually
const envPath = path.join(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const parts = line.split('=');
  if (parts.length >= 2) {
    env[parts[0].trim()] = parts.slice(1).join('=').trim();
  }
});

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const supabaseAnonKey = env['NEXT_PUBLIC_SUPABASE_ANON_KEY'];

console.log('Connecting to:', supabaseUrl);
const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    transport: ws
  }
});

async function run() {
  // Sign in as admin
  console.log('Logging in as admin...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'admin@magicthreads.com',
    password: 'admin123'
  });

  if (authError) {
    console.error('Authentication failed:', authError);
    return;
  }
  console.log('Authentication successful for:', authData.user.email);

  // Check if product already exists
  const { data: existingProduct, error: fetchError } = await supabase
    .from('products')
    .select('id')
    .eq('id', 'nh-18')
    .maybeSingle();

  if (fetchError) {
    console.error('Error checking product existence:', fetchError);
    return;
  }

  const productPayload = {
    id: 'nh-18',
    name: 'Midnight Royale Traditional Chaniya Choli Set (NH18)',
    category: 'chaniya-choli',
    price: 4200,
    originalPrice: 6500,
    discount: 35,
    image: '/images/NH18.jpeg',
    description: 'Make a graceful statement this festive season with our Midnight Royale Designer Chaniya Choli Set. Featuring a sophisticated navy blue lehenga and blouse paired with a vibrant red embroidered odhani, this ensemble beautifully reflects the richness of traditional Indian craftsmanship. The elegant silhouette, subtle dotted pattern, and intricately designed odhani create a timeless festive look that is both classic and contemporary. Perfect for Navratri celebrations, Garba nights, weddings, festive occasions, and cultural gatherings, this outfit offers comfort, elegance, and effortless style.',
    fabric: 'Premium Rayon Cotton Blend',
    workType: 'Fine Dotted Print with Traditional Borders',
    flare: 'Approx. 7.5 Meters',
    blouse: 'Round Neck Elbow-Length Sleeves (Adjustable up to 42 Inches)',
    dupatta: 'Bright Red Cotton Silk Blend with Intricate Motifs (2.15 Meters)',
    isAvailable: false,
    tag: 'Coming Soon',
    lehengaDetails: {
      fabric: 'Premium Rayon Cotton Blend',
      color: 'Midnight Navy Blue',
      flair: 'Approx. 7.5 Meters',
      waist: 'Up to 40 Inches',
      length: '42 Inches',
      work: 'Fine All-Over Traditional Dotted Print with Soft Cotton Lining and Drawstring Tassels'
    },
    blouseDetails: {
      fabric: 'Premium Rayon Cotton Blend',
      color: 'Midnight Navy Blue',
      style: 'Round Neck',
      sleeves: 'Elbow-Length Sleeves',
      size: 'Adjustable up to 42 Inches',
      work: 'Fine Dotted Pattern with Elegant Finish'
    },
    dupattaDetails: {
      fabric: 'Premium Cotton Silk Blend',
      color: 'Bright Red',
      length: 'Approx. 2.15 Meters (Width: Approx. 0.90 Meter)',
      work: 'Traditional Ethnic Print with Intricate Motif Design (Soft and Easy to Drape)'
    },
    highlights: [
      'Elegant and Sophisticated Color Combination',
      'Traditional Printed Odhani with Rich Ethnic Detailing',
      'Comfortable Fabric Suitable for All-Day Wear',
      'Graceful Flared Lehenga',
      'Lightweight and Easy to Carry',
      'Perfect Blend of Tradition and Modern Style',
      'Premium Stitching and Fine Finishing'
    ],
    careInstructions: [
      'Dry Clean Recommended',
      'Do Not Machine Wash',
      'Do Not Bleach',
      'Do Not Tumble Dry',
      'Iron on Low Heat from Reverse Side',
      'Avoid Direct Exposure to Harsh Sunlight',
      'Store in a Clean and Dry Place',
      'Handle Printed Odhani with Care'
    ],
    note: '📌 Actual product color may slightly vary due to photographic lighting and device screen settings. Minor variations in print placement may occur due to the handcrafted nature of the product. Jewellery and accessories shown in the images are for styling purposes only and are not included with the product.',
    styleStatement: 'Pair this elegant outfit with oxidized silver jewellery, traditional jhumkas, a statement choker, and embroidered juttis for a stunning festive look. Add a matching red bindi to enhance the traditional appeal.'
  };

  if (existingProduct) {
    console.log('Product NH18 already exists, updating it...');
    const { error: updateError } = await supabase
      .from('products')
      .update(productPayload)
      .eq('id', 'nh-18');
    if (updateError) {
      console.error('Update failed:', updateError);
    } else {
      console.log('Product NH18 updated successfully!');
    }
  } else {
    console.log('Inserting new product NH18...');
    const { error: insertError } = await supabase
      .from('products')
      .insert([productPayload]);
    if (insertError) {
      console.error('Insertion failed:', insertError);
    } else {
      console.log('Product NH18 inserted successfully!');
    }
  }
}

run().catch(console.error);
