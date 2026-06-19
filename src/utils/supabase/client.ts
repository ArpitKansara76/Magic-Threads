import { createClient } from '@supabase/supabase-js';
import { mockSupabase } from './mockClient';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Check if we are running in development/dummy mode with placeholders
const isPlaceholder = 
  !supabaseUrl || 
  !supabaseAnonKey || 
  supabaseUrl.includes('placeholder') || 
  supabaseAnonKey.includes('placeholder');

if (isPlaceholder && typeof window !== 'undefined') {
  console.log("🌸 Running Navrang Chaniya Choli in [Dummy Mode] using LocalStorage Database.");
}

export const supabase = isPlaceholder 
  ? (mockSupabase as any) 
  : (() => {
      const client = createClient(supabaseUrl, supabaseAnonKey);
      try {
        const builder = client.from('products').select('*');
        let proto = Object.getPrototypeOf(builder);
        while (proto && proto !== Object.prototype) {
          if (!proto.async) {
            proto.async = function() {
              return this;
            };
          }
          proto = Object.getPrototypeOf(proto);
        }
      } catch (err) {
        console.error("Failed to patch Supabase client prototypes:", err);
      }
      return client;
    })();

/**
 * Uploads a file to Supabase Storage or reads it locally as a Base64 string in dummy mode.
 */
export async function uploadProductImage(file: File): Promise<string> {
  if (isPlaceholder) {
    // Local / Dummy Mode: Read file as Base64 Data URL so it is fully self-contained in LocalStorage
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (typeof reader.result === 'string') {
          resolve(reader.result);
        } else {
          reject(new Error("File conversion failed"));
        }
      };
      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };
      reader.readAsDataURL(file);
    });
  } else {
    // Production Mode: Upload to Supabase Storage Bucket 'product-images'
    const fileExt = file.name.split('.').pop() || 'jpg';
    const fileName = `${Math.random().toString(36).substring(2, 11)}_${Date.now()}.${fileExt}`;
    const filePath = `products/${fileName}`;

    // Upload the file to the bucket 'product-images'
    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      throw new Error(`Storage upload failed: ${error.message}`);
    }

    // Retrieve the public serving URL
    const { data: { publicUrl } } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return publicUrl;
  }
}

