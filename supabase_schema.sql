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
    id, name, category, price, "originalPrice", discount, image, description, fabric, "workType", flare, blouse, dupatta, "isAvailable", tag, images, video
) VALUES
('nh-09', 'Vibrant Guler Kathiawadi Chaniya Choli (NH09)', 'chaniya-choli', 8499, 13999, 39, '/images/NH09.png', 'An absolute masterpiece for Navratri! This gorgeous Kathiawadi-style cotton Chaniya Choli features detailed traditional mirror work and vibrant patch embroidery. Includes a massive flare designed for spectacular twirls during Garba.', 'Premium Heavy Cotton', 'Authentic Gujarati Patchwork, Real Mirror Work, and Handloom Borders', '7.0 Meters Double-Layer Flare', 'Fully Stitched (Size 38-42 adjustable)', '2.3 Meters Cotton Dupatta with Wool Tassels', true, 'Navratri Special', ARRAY['/images/NH09.png','/images/NH09-1.jpeg','/images/NH09-2.jpeg','/images/NH09-3.jpeg','/images/NH09-4.jpeg','/images/NH09-5.jpeg']::TEXT[], '/videos/NH09.mp4'),
('nh-12', 'Royal Peacock Blue Chikankari Chaniya Choli (NH12)', 'chaniya-choli', 12999, 19999, 35, '/images/NH121.jpg', 'Elegant and modern royal peacock blue designer Chaniya Choli. Showcasing exquisite Lucknowi Chikankari embroidery interspersed with delicate sequins. Perfect for wedding receptions, sangeet, and high-fashion festivals.', 'Premium Faux Georgette & Silk Lining', 'Detailed Lucknowi Chikankari work with Sparkly Sequin embellishments', '6.5 Meters Ghera', 'Semi-stitched (customizable up to Bust size 44)', '2.4 Meters Soft Net Dupatta with Scalloped Lace Borders', true, 'Best Seller', ARRAY['/images/NH121.jpg','/images/NH122.jpg','/images/NH123.jpg','/images/NH124.jpg','/images/NH125.jpg']::TEXT[], '/videos/NH12.mp4'),
('nh-16', 'Crimson Golden Zardosi Silk Lehenga (NH16)', 'chaniya-choli', 16499, 24999, 34, '/images/NH16.jpg', 'Make a striking statement. This raw silk bridal/festive Chaniya Choli is crafted in stunning crimson red, embellished with rich gold zari and hand-finished zardozi patterns. Creates a mesmerizing look for brides and special family occasions.', 'Premium Banarasi Raw Silk', 'Handcrafted Zardozi, Golden Zari threadwork, and micro-pearl borders', '6.0 Meters Kali-cut Ghera', 'Semi-stitched (customizable up to Bust size 44)', '2.4 Meters Pure Silk Dupatta with Gold Zari border', true, 'Bridal Premium', ARRAY['/images/NH16.jpg','/images/NH16-1.jpg','/images/NH16-2.jpg']::TEXT[], '/videos/NH16.mp4'),
('nh-17', 'Luxury Maroon Gota-Patti Velvet Lehenga (NH17)', 'chaniya-choli', 10999, 17999, 39, '/images/NH175.jpg', 'An elegant, premium deep maroon velvet Chaniya Choli featuring traditional Rajasthani Gota-Patti embroidery. The skirt contains heavy double can-can inside for a rich flare, making it ideal for winter weddings and premium receptions.', 'Micro Velvet 9000', 'Rajasthani Gota-Patti and intricate Golden Dori embroidery', '6.5 Meters Flare with Double Can-can inside', 'Fully Stitched Size 40 (expandable to 42)', '2.3 Meters Pure Georgette Dupatta with Heavy Gota lace border', true, 'Designer Pick', ARRAY['/images/NH171.jpg','/images/NH172.jpg','/images/NH173.jpg','/images/NH174.jpg','/images/NH175.jpg']::TEXT[], '/videos/NH17-final-video.mp4'),
('cc-001', 'Vibrant Navrang Mirror-Work Chaniya Choli', 'chaniya-choli', 5499, 8999, 38, '/images/navratri.png', 'Get ready to rock the Garba floor! This stunning multi-colored cotton Chaniya Choli is designed for Navratri, showcasing detailed Gujarati patchwork, heavy mirror embroidery, and a massive 7-meter flare that twirls beautifully in the circles of Garba.', '100% Pure Premium Cotton', 'Authentic Gujarati Patchwork, Real Mirror Work, and Gota-Patti Border', '7.0 Meters Double-Layer Flare', 'Fully Stitched (Bust size 38-42 adjustable)', '2.3 Meters Cotton Dupatta with Wool Tassels', true, 'Navratri Special', NULL, NULL),
('cc-002', 'Royal Zardosi Bridal Silk Chaniya Choli', 'chaniya-choli', 18999, 29999, 36, '/images/bridal.png', 'Make your special day unforgettable. This heavy raw silk bridal Chaniya Choli is finished in a royal crimson red, embellished with rich gold zari work, hand-crafted zardozi, and micro-pearls. Ideal for weddings, receptions, and royal occasions.', 'Premium Raw Banarasi Silk', 'Handcrafted Zardozi, Golden Zari thread-work, and Stone embellishments', '5.5 Meters Kali-cut Flare', 'Semi-stitched (customizable up to Bust size 44)', 'Heavy Bridal Net Dupatta with Embroidered Border and Buttis', true, 'Best Seller', NULL, NULL),
('cc-003', 'Ethereal Pastel Floral Georgette Chaniya Choli', 'chaniya-choli', 8499, 12999, 34, '/images/pastel.png', 'Elegant and modern. A pastel mint-green and powder-pink designer fusion Chaniya Choli featuring delicate floral motifs, soft net dupatta, and a light-weight georgette skirt. Perfect for sangeet, mehendi, and reception parties.', 'Premium Georgette', 'Fine Resham Threadwork, Sequin embroidery, and Designer borders', '6.0 Meters Flare', 'Semi-stitched with Designer Back Pattern', '2.4 Meters Soft Net Dupatta with Scalloped Embroidered Border', true, 'Designer Pick', NULL, NULL),
('cc-004', 'Traditional Patola Print Silk Chaniya Choli', 'chaniya-choli', 6299, 9999, 37, '/images/navratri.png', 'Bring back Gujarati heritage with this beautiful Patola printed art silk Chaniya Choli. It combines mustard yellow and forest green patterns with a traditional design, perfect for pooja, festive functions, and Garba nights.', 'Art Silk with Silk lining', 'Authentic Gujarati Patola Print and Zari Weaved border', '6.0 Meters Flare', 'Unstitched (1.0 Meter fabric included)', 'Patola Silk Dupatta with Zari borders', true, 'Traditional', NULL, NULL),
('cc-005', 'Gilded Velvet Royal Lehenga Choli', 'chaniya-choli', 21999, 34999, 37, '/images/bridal.png', 'Luxurious dark wine velvet Chaniya Choli set adorned with intricate golden dori work and sequin borders, creating a grand silhouette for winter weddings and premium receptions.', 'Micro Velvet 9000', 'Multi-thread Resham and heavy Golden Dori embroidery', '5.0 Meters Flare with Double Can-can inside', 'Fully Stitched Size 40 (expandable to 42)', 'Sheer Organza Silk Dupatta with Embroidered Borders', true, 'Trending', NULL, NULL),
('cc-006', 'Blossom Pink Organza Lehenga Choli', 'chaniya-choli', 7999, 11999, 33, '/images/pastel.png', 'A breezy, light-weight powder pink organza Chaniya Choli with fine floral thread embroidery. Ideal for day events, sangeet, or modern festive parties.', 'Premium Organza', 'Multi-color thread embroidery and delicate Gota Lace Borders', '6.5 Meters Lightweight Flare', 'Unstitched (1.0 Meter Organza + Satin inner)', 'Organza Dupatta with Floral Borders', true, 'New Arrival', NULL, NULL),
('hd-001', 'Gujarati Mirror-Work Wall Hanging', 'home-decor', 2499, 3999, 37, '/images/home_decor.png', 'Decorate your home with this beautiful handcrafted Gujarati wall hanging. Detailed with colorful embroidery, mirror work, and traditional motifs, it brings a vibrant festive vibe to any living room or entryway.', 'Premium Cotton & Woolen Tassels', 'Authentic Kutch Hand Embroidery, Patchwork, and Mirror Embellishments', 'N/A (36 x 24 inches)', 'N/A', 'N/A', true, 'Best Seller', NULL, NULL),
('cc-cover-001', 'Festive Mirror-Work Cushion Cover Set', 'cushion-covers', 1299, 1999, 35, '/images/cushion_cover.png', 'A gorgeous set of 3 cushion covers featuring detailed traditional Gujarati embroidery and real mirror work. These vibrant covers are perfect for adding a touch of ethnic elegance to your sofa, chair, or bed.', '100% Cotton with Zipper Closure', 'Intricate Thread Embroidery, Mirror Accentuation, and Tassel Borders', 'N/A (16 x 16 inches)', 'N/A', 'N/A', true, 'New Arrival', NULL, NULL) ON CONFLICT (id) DO NOTHING;

