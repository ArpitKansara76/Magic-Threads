-- 1. PROFILES TABLE (Stores roles: user or admin)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create Policies for Profiles
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Users can update their own profiles" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);


-- 2. PRODUCTS TABLE (Stores catalog items)
CREATE TABLE public.products (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('chaniya-choli', 'home-decor', 'cushion-covers')),
    price NUMERIC NOT NULL,
    "originalPrice" NUMERIC NOT NULL,
    discount NUMERIC NOT NULL,
    image TEXT NOT NULL,
    description TEXT NOT NULL,
    fabric TEXT NOT NULL,
    "workType" TEXT NOT NULL,
    flare TEXT NOT NULL,
    blouse TEXT NOT NULL,
    dupatta TEXT NOT NULL,
    "isAvailable" BOOLEAN DEFAULT true,
    tag TEXT,
    images TEXT[],
    video TEXT,
    "lehengaDetails" JSONB,
    "blouseDetails" JSONB,
    "dupattaDetails" JSONB,
    "highlights" TEXT[],
    "careInstructions" TEXT[],
    "note" TEXT,
    "styleStatement" TEXT,
    "weight" TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Products
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create Policies for Products
CREATE POLICY "Products are viewable by everyone" ON public.products
    FOR SELECT USING (true);

CREATE POLICY "Only Admin can insert/edit products" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
        )
    );


-- 3. INQUIRY BAG TABLE (Syncs cart items per user)
CREATE TABLE public.inquiry_bag (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE (user_id, product_id)
);

-- Enable RLS for Inquiry Bag
ALTER TABLE public.inquiry_bag ENABLE ROW LEVEL SECURITY;

-- Create Policies for Inquiry Bag
CREATE POLICY "Users can manage their own bag items" ON public.inquiry_bag
    FOR ALL USING (auth.uid() = user_id);


-- 4. AUTOMATIC PROFILE CREATION TRIGGER
-- Whenever a user signs up via Supabase Auth, create a row in the public.profiles table automatically.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, role)
    VALUES (new.id, new.email, 'user');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ==========================================================
-- 💡 RUN THIS SQL IN THE SQL EDITOR TO SEED THE ADMIN USER:
-- ==========================================================
-- Email: admin@magicthreads.com
-- Password: admin123
-- ==========================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
BEGIN
    -- 1. Insert admin user into auth.users (bypasses email confirmation)
    INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, 
        email_confirmed_at, created_at, updated_at, 
        raw_app_meta_data, raw_user_meta_data, is_super_admin
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'admin@magicthreads.com',
        crypt('admin123', gen_salt('bf')),
        now(),
        now(),
        now(),
        '{"provider":"email","providers":["email"]}',
        '{}',
        false
    );

    -- 2. Elevate the auto-created profile to 'admin'
    UPDATE public.profiles 
    SET role = 'admin' 
    WHERE id = new_user_id;

END $$;
-- ==========================================================
--
-- ==========================================================
-- 📸 HOW TO SET UP SUPABASE STORAGE FOR PRODUCT IMAGES:
-- ==========================================================
-- 1. Go to your Supabase Dashboard online.
-- 2. Click on the "Storage" tab in the left sidebar.
-- 3. Click "Create new bucket".
-- 4. Name the bucket exactly: "product-images".
-- 5. Toggle ON "Public bucket" (this allows customers to view product photos).
-- 6. Go to "Policies" under Storage, and add an upload policy:
--    - Allow "INSERT" operations on the bucket only for authenticated users who are administrators.
--    - Alternatively, for simple configuration, allow all INSERT/UPDATE/SELECT operations.
-- ==========================================================
-- ==========================================================
-- 🌾 SEED DATA FOR PRODUCTS TABLE:
-- ==========================================================
INSERT INTO public.products (
    id, name, category, price, "originalPrice", discount, image, description, fabric, "workType", flare, blouse, dupatta, "isAvailable", tag, images, video,
    "lehengaDetails", "blouseDetails", "dupattaDetails", "highlights", "careInstructions", "note", "styleStatement"
) VALUES
('nh-04', 'Sunlit Elegance Designer Chaniya Choli Set (NH04)', 'chaniya-choli', 3800, 5999, 37, '/images/NH04.png', 'Celebrate the vibrant spirit of Navratri with this graceful designer Chaniya Choli set, beautifully crafted in a stunning combination of Mustard Yellow, Ivory White, and Deep Mehendi Green. The rich embroidered dupatta paired with a contemporary color-block lehenga creates an elegant yet festive look, making it a perfect choice for Garba, Dandiya nights, festive celebrations, and wedding functions.', 'Premium Cotton Blend', 'Designer Lace Border & Mirror Work', 'Approx. 5.5 – 6.0 Meters', 'V-Neck Designer Blouse with Silver Embroidery', 'Deep Mehendi Green bandhej with mirror work allover', true, 'Festive Pick', NULL, NULL,
 '{"fabric": "Premium Cotton Blend", "color": "Mustard Yellow & Ivory White", "flair": "Approx. 5.5 – 6.0 Meters", "waist": "Fits up to 40 inches", "length": "42 inches", "work": "Designer lace border with elegant finishing"}'::JSONB,
 '{"fabric": "Premium Cotton Silk Blend", "color": "Mustard Yellow with Silver Embroidery", "style": "V-Neck Designer Blouse", "sleeves": "Half Sleeves", "size": "Stitched (Customizable as per availability)", "work": "Intricate embroidered neckline and sleeves"}'::JSONB,
 '{"fabric": "Premium Jacquard / Banarasi Weave", "color": "Deep Mehendi Green bandhej with mirror work allover", "length": "Approx. 2.3–2.5 Meters", "work": "Rich traditional woven motifs, intricate geometric patterns, and designer woven border with premium finish"}'::JSONB,
 ARRAY['Elegant festive colour combination', 'Comfortable and lightweight fabric', 'Premium embroidered blouse', 'Rich designer woven dupatta', 'Perfect for Navratri, Garba, Wedding Functions & Festive Occasions', 'Excellent fall and graceful silhouette']::TEXT[],
 ARRAY['Dry Clean Only', 'Do Not Machine Wash', 'Do Not Bleach', 'Steam or Low Heat Iron Recommended', 'Store in a cool, dry place', 'Keep away from direct sunlight for prolonged periods']::TEXT[],
 '📌 The displayed image is AI-generated for presentation purposes. Actual product colours, embroidery patterns, lace, borders, and fabric shades may vary slightly due to lighting, photography, screen resolution, and manufacturing variations.',
 'Step into every celebration with timeless elegance, vibrant colours, and the charm of traditional craftsmanship.'),
('nh-09', 'Vibrant Guler Kathiawadi Chaniya Choli (NH09)', 'chaniya-choli', 8499, 13999, 39, '/images/NH09.png', 'An absolute masterpiece for Navratri! This gorgeous Kathiawadi-style cotton Chaniya Choli features detailed traditional mirror work and vibrant patch embroidery. Includes a massive flare designed for spectacular twirls during Garba.', 'Premium Heavy Cotton', 'Authentic Gujarati Patchwork, Real Mirror Work, and Handloom Borders', '7.0 Meters Double-Layer Flare', 'Fully Stitched (Size 38-42 adjustable)', '2.3 Meters Cotton Dupatta with Wool Tassels', true, 'Navratri Special', ARRAY['/images/NH09.png','/images/NH09-1.jpeg','/images/NH09-2.jpeg','/images/NH09-3.jpeg','/images/NH09-4.jpeg','/images/NH09-5.jpeg']::TEXT[], '/videos/NH09.mp4', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('nh-12', 'Royal Peacock Blue Chikankari Chaniya Choli (NH12)', 'chaniya-choli', 12999, 19999, 35, '/images/NH121.jpg', 'Elegant and modern royal peacock blue designer Chaniya Choli. Showcasing exquisite Lucknowi Chikankari embroidery interspersed with delicate sequins. Perfect for wedding receptions, sangeet, and high-fashion festivals.', 'Premium Faux Georgette & Silk Lining', 'Detailed Lucknowi Chikankari work with Sparkly Sequin embellishments', '6.5 Meters Ghera', 'Semi-stitched (customizable up to Bust size 44)', '2.4 Meters Soft Net Dupatta with Scalloped Lace Borders', true, 'Best Seller', ARRAY['/images/NH121.jpg','/images/NH122.jpg','/images/NH123.jpg','/images/NH124.jpg','/images/NH125.jpg']::TEXT[], '/videos/NH12.mp4', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('nh-16', 'Crimson Golden Zardosi Silk Lehenga (NH16)', 'chaniya-choli', 16499, 24999, 34, '/images/NH16.jpg', 'Make a striking statement. This raw silk bridal/festive Chaniya Choli is crafted in stunning crimson red, embellished with rich gold zari and hand-finished zardozi patterns. Creates a mesmerizing look for brides and special family occasions.', 'Premium Banarasi Raw Silk', 'Handcrafted Zardozi, Golden Zari threadwork, and micro-pearl borders', '6.0 Meters Kali-cut Ghera', 'Semi-stitched (customizable up to Bust size 44)', '2.4 Meters Pure Silk Dupatta with Gold Zari border', true, 'Bridal Premium', ARRAY['/images/NH16.jpg','/images/NH16-1.jpg','/images/NH16-2.jpg']::TEXT[], '/videos/NH16.mp4', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('nh-17', 'Luxury Maroon Gota-Patti Velvet Lehenga (NH17)', 'chaniya-choli', 10999, 17999, 39, '/images/NH175.jpg', 'An elegant, premium deep maroon velvet Chaniya Choli featuring traditional Rajasthani Gota-Patti embroidery. The skirt contains heavy double can-can inside for a rich flare, making it ideal for winter weddings and premium receptions.', 'Micro Velvet 9000', 'Rajasthani Gota-Patti and intricate Golden Dori embroidery', '6.5 Meters Flare with Double Can-can inside', 'Fully Stitched Size 40 (expandable to 42)', '2.3 Meters Pure Georgette Dupatta with Heavy Gota lace border', true, 'Designer Pick', ARRAY['/images/NH171.jpg','/images/NH172.jpg','/images/NH173.jpg','/images/NH174.jpg','/images/NH175.jpg']::TEXT[], '/videos/NH17-final-video.mp4', NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('cc-001', 'Vibrant Navrang Mirror-Work Chaniya Choli', 'chaniya-choli', 5499, 8999, 38, '/images/navratri.png', 'Get ready to rock the Garba floor! This stunning multi-colored cotton Chaniya Choli is designed for Navratri, showcasing detailed Gujarati patchwork, heavy mirror embroidery, and a massive 7-meter flare that twirls beautifully in the circles of Garba.', '100% Pure Premium Cotton', 'Authentic Gujarati Patchwork, Real Mirror Work, and Gota-Patti Border', '7.0 Meters Double-Layer Flare', 'Fully Stitched (Bust size 38-42 adjustable)', '2.3 Meters Cotton Dupatta with Wool Tassels', true, 'Navratri Special', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('cc-002', 'Royal Zardosi Bridal Silk Chaniya Choli', 'chaniya-choli', 18999, 29999, 36, '/images/bridal.png', 'Make your special day unforgettable. This heavy raw silk bridal Chaniya Choli is finished in a royal crimson red, embellished with rich gold zari work, hand-crafted zardozi, and micro-pearls. Ideal for weddings, receptions, and royal occasions.', 'Premium Raw Banarasi Silk', 'Handcrafted Zardozi, Golden Zari thread-work, and Stone embellishments', '5.5 Meters Kali-cut Flare', 'Semi-stitched (customizable up to Bust size 44)', 'Heavy Bridal Net Dupatta with Embroidered Border and Buttis', true, 'Best Seller', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('cc-003', 'Ethereal Pastel Floral Georgette Chaniya Choli', 'chaniya-choli', 8499, 12999, 34, '/images/pastel.png', 'Elegant and modern. A pastel mint-green and powder-pink designer fusion Chaniya Choli featuring delicate floral motifs, soft net dupatta, and a light-weight georgette skirt. Perfect for sangeet, mehendi, and reception parties.', 'Premium Georgette', 'Fine Resham Threadwork, Sequin embroidery, and Designer borders', '6.0 Meters Flare', 'Semi-stitched with Designer Back Pattern', '2.4 Meters Soft Net Dupatta with Scalloped Embroidered Border', true, 'Designer Pick', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('cc-004', 'Traditional Patola Print Silk Chaniya Choli', 'chaniya-choli', 6299, 9999, 37, '/images/navratri.png', 'Bring back Gujarati heritage with this beautiful Patola printed art silk Chaniya Choli. It combines mustard yellow and forest green patterns with a traditional design, perfect for pooja, festive functions, and Garba nights.', 'Art Silk with Silk lining', 'Authentic Gujarati Patola Print and Zari Weaved border', '6.0 Meters Flare', 'Unstitched (1.0 Meter fabric included)', 'Patola Silk Dupatta with Zari borders', true, 'Traditional', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('cc-005', 'Gilded Velvet Royal Lehenga Choli', 'chaniya-choli', 21999, 34999, 37, '/images/bridal.png', 'Luxurious dark wine velvet Chaniya Choli set adorned with intricate golden dori work and sequin borders, creating a grand silhouette for winter weddings and premium receptions.', 'Micro Velvet 9000', 'Multi-thread Resham and heavy Golden Dori embroidery', '5.0 Meters Flare with Double Can-can inside', 'Fully Stitched Size 40 (expandable to 42)', 'Sheer Organza Silk Dupatta with Embroidered Borders', true, 'Trending', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('cc-006', 'Blossom Pink Organza Lehenga Choli', 'chaniya-choli', 7999, 11999, 33, '/images/pastel.png', 'A breezy, light-weight powder pink organza Chaniya Choli with fine floral thread embroidery. Ideal for day events, sangeet, or modern festive parties.', 'Premium Organza', 'Multi-color thread embroidery and delicate Gota Lace Borders', '6.5 Meters Lightweight Flare', 'Unstitched (1.0 Meter Organza + Satin inner)', 'Organza Dupatta with Floral Borders', true, 'New Arrival', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('hd-001', 'Gujarati Mirror-Work Wall Hanging', 'home-decor', 2499, 3999, 37, '/images/home_decor.png', 'Decorate your home with this beautiful handcrafted Gujarati wall hanging. Detailed with colorful embroidery, mirror work, and traditional motifs, it brings a vibrant festive vibe to any living room or entryway.', 'Premium Cotton & Woolen Tassels', 'Authentic Kutch Hand Embroidery, Patchwork, and Mirror Embellishments', 'N/A (36 x 24 inches)', 'N/A', 'N/A', true, 'Best Seller', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('cc-cover-001', 'Festive Mirror-Work Cushion Cover Set', 'cushion-covers', 1299, 1999, 35, '/images/cushion_cover.png', 'A gorgeous set of 3 cushion covers featuring detailed traditional Gujarati embroidery and real mirror work. These vibrant covers are perfect for adding a touch of ethnic elegance to your sofa, chair, or bed.', '100% Cotton with Zipper Closure', 'Intricate Thread Embroidery, Mirror Accentuation, and Tassel Borders', 'N/A (16 x 16 inches)', 'N/A', 'N/A', true, 'New Arrival', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('nh-26', 'Golden Vine Festive Chaniya Choli Set (NH26)', 'chaniya-choli', 4500, 6999, 36, '/images/NH26.jpeg', 'Add a touch of royal elegance to your festive wardrobe with our Golden Vine Designer Chaniya Choli Set. This beautifully crafted ensemble features a rich wine lehenga paired with a vibrant mustard yellow odhani and a stylish floral printed blouse. The contrasting colors create a striking festive look, while the intricately printed border detailing adds traditional charm and sophistication. Designed for women who love timeless ethnic fashion, this outfit is perfect for Navratri, Garba nights, Dandiya celebrations, weddings, festive gatherings, and cultural events.', 'Premium Cotton Blend', 'Printed Floral Border with Decorative Lace Detailing', 'Approx. 6.5 to 7 Meters', 'Elbow-Length Sleeves (Adjustable up to 42 Inches)', 'Mustard Yellow Silk Blend with Lace Border (2.30 Meters)', true, 'New Arrival', NULL, NULL,
 '{"fabric": "Premium Cotton Blend", "color": "Deep Wine", "flair": "Approx. 6.5 to 7 Meters", "waist": "Fits up to 40 Inches", "length": "42 Inches", "work": "Printed Floral Border with Decorative Lace Detailing"}'::JSONB,
 '{"fabric": "Premium Cotton Blend", "color": "Wine & Mustard Yellow with Floral Print", "style": "V Neck", "sleeves": "Elbow-Length Sleeves", "size": "Adjustable up to 42 Inches", "work": "Traditional Floral Print with Decorative Border Finishing"}'::JSONB,
 '{"fabric": "Premium Silk Blend", "color": "Mustard Yellow", "length": "Approx. 2.30 Meters (Width: Approx. 0.90 Meter)", "work": "Delicate Butti Work with Decorative Lace Border"}'::JSONB,
 ARRAY['Elegant and Royal Festive Color Combination', 'Beautiful Floral Printed Blouse and Border Design', 'Grand Flared Lehenga for Stunning Twirls', 'Lightweight and Comfortable for Long Wear', 'Designer Odhani with Elegant Lace Border', 'Perfect Blend of Traditional and Contemporary Style', 'Premium Quality Stitching and Finishing']::TEXT[],
 ARRAY['Dry Clean Only', 'Do Not Machine Wash', 'Do Not Bleach', 'Do Not Tumble Dry', 'Iron at Low Temperature on Reverse Side', 'Avoid Direct Contact with Perfumes and Harsh Chemicals', 'Store in a Cool and Dry Place', 'Keep Away from Prolonged Direct Sunlight']::TEXT[],
 '📌 Product color may slightly vary due to photographic lighting and device screen settings. Minor variations in print placement may occur due to the handcrafted nature of the design. Jewellery and accessories shown in the images are for styling purposes only and are not included with the product.',
 'Pair this elegant ensemble with gold-toned jewellery, statement jhumkas, traditional bangles, and embroidered mojris for a graceful festive appearance. Complete the look with a mustard-yellow bindi and soft festive makeup.'),
('nh-27', 'Traditional Navratri Chaniya Choli Set (NH27)', 'chaniya-choli', 4200, 6500, 35, '/images/NH27.jpeg', 'Celebrate the festive spirit in timeless Gujarati tradition with this beautifully crafted Chaniya Choli set. Featuring a rich combination of deep green and vibrant rani pink, enhanced with traditional decorative borders and elegant detailing, this outfit is perfect for Garba, Dandiya, Navratri celebrations, weddings, and festive occasions.', 'Premium Jam Cotton / Satin Blend', 'Heavy Gamthi Lace and Zari Border Work', 'Approx. 5.5 – 6 Meters', 'Sweetheart Neck Half Sleeves (1 inch margin for alteration)', 'Rani Pink Vintage Lagdi Patta (2.25 Meters)', true, 'New Arrival', NULL, NULL,
 '{"fabric": "Jam Cotton / Satin / Taffeta Silk", "color": "Deep Bottle Green", "flair": "Approx. 5.5 – 6 Meters", "waist": "Fits up to 40 Inches", "length": "Approx. 42 Inches", "work": "Traditional woven border and festive embellishments"}'::JSONB,
 '{"fabric": "Premium quality jam cotton/satin fabric", "color": "Dark Green with heavy gamthi lace and dark pink border", "style": "Sweetheart Neck, Traditional Kutchi-inspired design", "sleeves": "Half Sleeves", "size": "Standard sizes (with 1 inch margin for alteration)", "work": "Traditional decorative border work with ethnic motifs"}'::JSONB,
 '{"fabric": "Dark pink vintage lagdi patta odhani", "color": "Rani Pink", "length": "Approx. 2.25 Meters", "work": "Elegant zari border with traditional motif detailing"}'::JSONB,
 ARRAY['Traditional Gujarati/Navratri Collection', 'Rich Festive Color Combination', 'Comfortable for Long Garba Nights', 'Beautiful Ethnic Border Work', 'Ideal for Navratri, Garba, Dandiya, Weddings & Cultural Events', 'Elegant and Eye-Catching Traditional Look']::TEXT[],
 ARRAY['Dry Clean Only', 'Do Not Machine Wash', 'Do Not Bleach', 'Iron on Low Heat from Reverse Side', 'Store in a Cool & Dry Place', 'Keep Away from Direct Sunlight for Long Duration']::TEXT[],
 '📌 Product color may slightly vary due to photographic lighting and device screen settings. Minor variations in print placement may occur due to the handcrafted nature of the design. Jewellery and accessories shown in the images are for styling purposes only and are not included with the product.',
 'Turn heads this festive season with our stunning Green & Rani Pink Traditional Chaniya Choli Set. Featuring a graceful flared lehenga, beautifully crafted blouse, and elegant zari-bordered odhani, this ensemble is designed to make your Garba nights unforgettable.'),
('nh-15', 'Mehendi Raas Designer Chaniya Choli Set (NH15)', 'chaniya-choli', 4200, 6500, 35, '/images/NH15.jpeg', 'A timeless celebration of elegance, tradition, and festive charm. Gracefully crafted in a rich Dark Mehendi Green shade with delicate dotted patterns, this beautiful Chaniya Choli set is designed for women who love understated elegance with a traditional touch. Paired with a stunning ethnic printed odhani with colorful tassels, this ensemble is perfect for Navratri, Garba, weddings, festive gatherings, and cultural celebrations.', 'Premium Cotton Silk / Cotton Blend', 'Delicate Dotted Patterns with Handmade Tassels', 'Approx. 7.5 Meters', 'V-Neck Elbow-Length Sleeves (Contemporary Fit)', 'Bright Red-Green Printed Soft Cotton Silk Blend (2.25 Meters)', true, 'New Arrival', NULL, NULL,
 '{"fabric": "Premium Cotton Blend", "color": "Dark Mehendi Green", "flair": "Approx. 7.5 Meters", "waist": "Adjustable Drawstring (Free Size)", "length": "Approx. 40 – 42 Inches", "work": "Elegant All-Over Dotted Design with Handmade Multicolor Decorative Tassels"}'::JSONB,
 '{"fabric": "Premium Cotton Silk Blend", "color": "Dark Mehendi Green", "style": "V-Neck, Contemporary Traditional Fit", "sleeves": "Elbow-Length Sleeves", "size": "Adjustable / Free Size", "work": "Fine white Dotted Design"}'::JSONB,
 '{"fabric": "Soft Cotton Silk / Art Silk Blend", "color": "Bright Red-green design print", "length": "Approx. 2.25 Meters", "work": "Detailed Heritage-Inspired Pattern with Colorful Hanging Tassels"}'::JSONB,
 ARRAY['Rich Dark Mehendi Green Color', 'Elegant Dotted Pattern Throughout', 'Beautiful Heritage-Inspired Odhani', 'Lightweight & Comfortable Wear', 'Perfect for Garba, Dandiya, Navratri & Weddings', 'Modern Silhouette with Traditional Charm', 'Flowy Lehenga with Excellent Twirl Effect']::TEXT[],
 ARRAY['Dry Clean Recommended', 'Gentle Hand Wash Separately if Required', 'Do Not Machine Wash', 'Do Not Bleach', 'Iron on Low Heat', 'Store in a Cool and Dry Place']::TEXT[],
 '📌 The images used for promotional and social media purposes may be AI-enhanced or AI-generated for styling and presentation. Actual product colors, shades, prints, borders, tassels, embroidery, and other decorative elements may vary slightly from the images shown. Variations may occur due to lighting conditions, screen settings, photography, handcrafted work, and digital rendering. These minor differences do not affect the overall beauty, quality, or craftsmanship of the product.',
 'Turn heads this festive season with our stunning Dark Mehendi Green Dotted Chaniya Choli Set. Featuring a graceful flared lehenga, elegant V-neck blouse, and a beautifully printed festive odhani with colorful tassels, this ensemble is designed to make your Garba nights unforgettable.'),
('nh-18', 'Midnight Royale Traditional Chaniya Choli Set (NH18)', 'chaniya-choli', 4200, 6500, 35, '/images/NH18.jpeg', 'Make a graceful statement this festive season with our Midnight Royale Designer Chaniya Choli Set. Featuring a sophisticated navy blue lehenga and blouse paired with a vibrant red embroidered odhani, this ensemble beautifully reflects the richness of traditional Indian craftsmanship. The elegant silhouette, subtle dotted pattern, and intricately designed odhani create a timeless festive look that is both classic and contemporary. Perfect for Navratri celebrations, Garba nights, weddings, festive occasions, and cultural gatherings, this outfit offers comfort, elegance, and effortless style.', 'Premium Rayon Cotton Blend', 'Fine Dotted Print with Traditional Borders', 'Approx. 7.5 Meters', 'Round Neck Elbow-Length Sleeves (Adjustable up to 42 Inches)', 'Bright Red Cotton Silk Blend with Intricate Motifs (2.15 Meters)', false, 'Coming Soon', NULL, NULL,
 '{"fabric": "Premium Rayon Cotton Blend", "color": "Midnight Navy Blue", "flair": "Approx. 7.5 Meters", "waist": "Up to 40 Inches", "length": "42 Inches", "work": "Fine All-Over Traditional Dotted Print with Soft Cotton Lining and Drawstring Tassels"}'::JSONB,
 '{"fabric": "Premium Rayon Cotton Blend", "color": "Midnight Navy Blue", "style": "Round Neck", "sleeves": "Elbow-Length Sleeves", "size": "Adjustable up to 42 Inches", "work": "Fine Dotted Pattern with Elegant Finish"}'::JSONB,
 '{"fabric": "Premium Cotton Silk Blend", "color": "Bright Red", "length": "Approx. 2.15 Meters (Width: Approx. 0.90 Meter)", "work": "Traditional Ethnic Print with Intricate Motif Design (Soft and Easy to Drape)"}'::JSONB,
 ARRAY['Elegant and Sophisticated Color Combination', 'Traditional Printed Odhani with Rich Ethnic Detailing', 'Comfortable Fabric Suitable for All-Day Wear', 'Graceful Flared Lehenga', 'Lightweight and Easy to Carry', 'Perfect Blend of Tradition and Modern Style', 'Premium Stitching and Fine Finishing']::TEXT[],
 ARRAY['Dry Clean Recommended', 'Do Not Machine Wash', 'Do Not Bleach', 'Do Not Tumble Dry', 'Iron on Low Heat from Reverse Side', 'Avoid Direct Exposure to Harsh Sunlight', 'Store in a Clean and Dry Place', 'Handle Printed Odhani with Care']::TEXT[],
 '📌 Actual product color may slightly vary due to photographic lighting and device screen settings. Minor variations in print placement may occur due to the handcrafted nature of the product. Jewellery and accessories shown in the images are for styling purposes only and are not included with the product.',
 'Pair this elegant outfit with oxidized silver jewellery, traditional jhumkas, a statement choker, and embroidered juttis for a stunning festive look. Add a matching red bindi to enhance the traditional appeal.') ON CONFLICT (id) DO NOTHING;


