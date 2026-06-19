'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import { products as initialProducts, Product } from '../data/products';
import { supabase } from '../utils/supabase/client';

// Configurable seller phone number (with country code, e.g., +91 for India)
const SELLER_WHATSAPP_NUMBER = '919876543210'; 

const formatCategory = (cat: string) => {
  if (cat === 'chaniya-choli') return 'Chaniya Choli';
  if (cat === 'home-decor') return 'Home Decor';
  if (cat === 'cushion-covers') return 'Cushion Covers';
  return cat;
};

export default function CatalogPage() {
  // --- States ---
  const [productsList, setProductsList] = useState<Product[]>(initialProducts);
  const [user, setUser] = useState<any | null>(null);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [activeMedia, setActiveMedia] = useState<{type: 'image' | 'video', url: string} | null>(null);
  
  // Inquiry Modals
  const [inquiryProduct, setInquiryProduct] = useState<Product | null>(null);
  const [isBulkInquiry, setIsBulkInquiry] = useState<boolean>(false);
  const [showInquiryModal, setShowInquiryModal] = useState<boolean>(false);
  
  // Form fields
  const [userName, setUserName] = useState<string>('');
  const [userPhone, setUserPhone] = useState<string>('');
  const [customNotes, setCustomNotes] = useState<string>('');
  
  // Inquiry Bag (Cart)
  const [inquiryBag, setInquiryBag] = useState<Product[]>([]);
  const [isBagOpen, setIsBagOpen] = useState<boolean>(false);
  
  // Toast notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Load products, user and sync bag on mount
  useEffect(() => {
    const initApp = async () => {
      setLoading(true);
      try {
        // 1. Fetch products from database
        const { data: dbProducts } = await supabase.from('products').select('*').async();
        if (dbProducts && dbProducts.length > 0) {
          setProductsList(dbProducts);
        } else {
          // Fallback to initialProducts if database has 0 products
          setProductsList(initialProducts);
        }

        // 2. Fetch active session user
        const { data: { user: currentUser } } = await supabase.auth.getUser();
        if (currentUser) {
          setUser(currentUser);
          
          // Fetch profile for role
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();
          setUserProfile(profile);

          // Fetch database synced cart items
          const { data: dbBag } = await supabase
            .from('inquiry_bag')
            .select('*')
            .eq('user_id', currentUser.id)
            .async();

          if (dbBag && dbBag.length > 0) {
            setInquiryBag(dbBag);
            localStorage.setItem('chaniya_choli_inquiry_bag', JSON.stringify(dbBag));
          } else {
            // If DB bag is empty, load from localStorage if exists
            const localBag = localStorage.getItem('chaniya_choli_inquiry_bag');
            if (localBag) {
              const parsed = JSON.parse(localBag) as Product[];
              setInquiryBag(parsed);
              // Sync localBag to DB
              const rows = parsed.map(item => ({ user_id: currentUser.id, product_id: item.id }));
              await supabase.from('inquiry_bag').insert(rows).async();
            }
          }
        } else {
          // Not logged in, load from localStorage
          const localBag = localStorage.getItem('chaniya_choli_inquiry_bag');
          if (localBag) {
            setInquiryBag(JSON.parse(localBag));
          }
        }
      } catch (e) {
        console.error("Initialization error", e);
        // Fallback load
        const localBag = localStorage.getItem('chaniya_choli_inquiry_bag');
        if (localBag) setInquiryBag(JSON.parse(localBag));
      } finally {
        setLoading(false);
      }
    };
    
    initApp();
  }, []);

  // Save/Sync bag
  const saveBag = async (newBag: Product[]) => {
    setInquiryBag(newBag);
    localStorage.setItem('chaniya_choli_inquiry_bag', JSON.stringify(newBag));
    
    // If logged in, sync changes to Supabase database
    if (user) {
      try {
        // Clear all previous user bag rows
        await supabase.from('inquiry_bag').delete().eq('user_id', user.id).async();
        
        // Batch insert new rows
        if (newBag.length > 0) {
          const rows = newBag.map(item => ({ user_id: user.id, product_id: item.id }));
          await supabase.from('inquiry_bag').insert(rows).async();
        }
      } catch (e) {
        console.error("Failed to sync bag to database", e);
      }
    }
  };

  // Toast helper
  const triggerToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setUserProfile(null);
    setInquiryBag([]);
    localStorage.removeItem('chaniya_choli_inquiry_bag');
    triggerToast("Signed out successfully.");
  };

  // --- Handlers ---
  const handleAddToBag = (product: Product, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click trigger
    if (inquiryBag.some(item => item.id === product.id)) {
      triggerToast(`${product.name} is already in your inquiry bag!`);
      return;
    }
    const updated = [...inquiryBag, product];
    saveBag(updated);
    triggerToast(`Added ${product.name} to inquiry bag!`);
  };

  const handleRemoveFromBag = (productId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = inquiryBag.filter(item => item.id !== productId);
    saveBag(updated);
    triggerToast("Item removed from bag.");
  };

  const openProductDetails = (product: Product) => {
    setSelectedProduct(product);
    if (product.video) {
      setActiveMedia({ type: 'video', url: product.video });
    } else {
      setActiveMedia({ type: 'image', url: product.image });
    }
  };

  const closeProductDetails = () => {
    setSelectedProduct(null);
    setActiveMedia(null);
  };

  const openSingleInquiry = (product: Product, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setInquiryProduct(product);
    setIsBulkInquiry(false);
    setCustomNotes('');
    setShowInquiryModal(true);
  };

  const openBulkInquiry = () => {
    if (inquiryBag.length === 0) return;
    setIsBulkInquiry(true);
    setInquiryProduct(null);
    setCustomNotes('');
    setIsBagOpen(false);
    setShowInquiryModal(true);
  };

  const closeInquiryModal = () => {
    setShowInquiryModal(false);
    setInquiryProduct(null);
    setIsBulkInquiry(false);
  };

  const handleSubmitInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userName.trim()) {
      alert("Please enter your name");
      return;
    }

    let messageText = '';
    
    if (isBulkInquiry) {
      // Formulate bulk WhatsApp message
      const itemsList = inquiryBag.map((item, index) => 
        `${index + 1}. *${item.name}* (ID: ${item.id}) - ₹${item.price.toLocaleString('en-IN')}`
      ).join('\n');

      messageText = `✨ *Magic Threads - Bulk Inquiry* ✨\n\n` +
        `Hello! I would like to inquire about the availability of the following items:\n\n` +
        `${itemsList}\n\n` +
        `*Customer Details:*\n` +
        `👤 *Name:* ${userName.trim()}\n` +
        (userPhone.trim() ? `📞 *Contact:* ${userPhone.trim()}\n` : '') +
        (customNotes.trim() ? `💬 *Customization/Message:* ${customNotes.trim()}\n` : '') +
        `\nCould you please share details on stock status and shipping? Thank you!`;
        
      // Clear bag after successful inquiry
      saveBag([]);
    } else if (inquiryProduct) {
      // Formulate single product WhatsApp message
      const currentUrl = window.location.origin + `/product/${inquiryProduct.id}`;
      messageText = `✨ *Magic Threads - Product Inquiry* ✨\n\n` +
        `Hello! I am interested in this item:\n\n` +
        `*Product:* ${inquiryProduct.name}\n` +
        `*Price:* ₹${inquiryProduct.price.toLocaleString('en-IN')} (Original: ₹${inquiryProduct.originalPrice.toLocaleString('en-IN')}, ${inquiryProduct.discount}% OFF)\n` +
        `*ID Code:* ${inquiryProduct.id}\n` +
        `*Fabric:* ${inquiryProduct.fabric}\n` +
        `*Work:* ${inquiryProduct.workType}\n` +
        `*Link:* ${currentUrl}\n\n` +
        `*Customer Details:*\n` +
        `👤 *Name:* ${userName.trim()}\n` +
        (userPhone.trim() ? `📞 *Contact:* ${userPhone.trim()}\n` : '') +
        (customNotes.trim() ? `💬 *Notes/Requirements:* ${customNotes.trim()}\n` : '') +
        `\nCan you confirm if this piece is available? Thank you!`;
    }

    // Generate WhatsApp url and open it in a new tab
    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${SELLER_WHATSAPP_NUMBER}&text=${encodedText}`;
    
    window.open(whatsappUrl, '_blank');
    closeInquiryModal();
    triggerToast("Inquiry sent successfully via WhatsApp!");
  };

  // --- Filtering Logic ---
  const filteredProducts = useMemo(() => {
    return productsList.filter(product => {
      const matchesCategory = selectedCategory === 'all' || product.category === selectedCategory;
      const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.workType.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            product.fabric.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [productsList, selectedCategory, searchQuery]);

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="nav-container">
          <a href="#" className="brand-logo" id="header-logo-link" style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', textDecoration: 'none' }}>
            <img src="/images/logo.png" alt="Magic Threads Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--color-gold)', boxShadow: '0 0 10px rgba(197, 155, 39, 0.3)' }} />
            <div>
              <span className="brand-logo-text" style={{ display: 'block', fontSize: '1.4rem', fontWeight: '700', letterSpacing: '1.5px' }}>MAGIC THREADS</span>
              <div className="brand-logo-sub" style={{ fontSize: '0.68rem', letterSpacing: '0.2px', textTransform: 'lowercase', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>where magic meets tradition</div>
            </div>
          </a>

          <nav>
            <ul className="nav-links">
              <li>
                <a href="#catalog" className="nav-link" onClick={() => setSelectedCategory('all')}>Catalog</a>
              </li>
              <li>
                <a href="#catalog" className="nav-link" onClick={() => setSelectedCategory('chaniya-choli')}>Chaniya Choli</a>
              </li>
              <li>
                <a href="#catalog" className="nav-link" onClick={() => setSelectedCategory('home-decor')}>Home Decor</a>
              </li>
              <li>
                <a href="#catalog" className="nav-link" onClick={() => setSelectedCategory('cushion-covers')}>Cushion Covers</a>
              </li>
            </ul>
          </nav>

          <div className="nav-actions">
            {/* User Profile / Auth links */}
            {user ? (
              <div className="user-nav-profile" style={{ marginRight: '1rem' }}>
                {userProfile?.role === 'admin' && (
                  <a 
                    href="/admin" 
                    className="btn-admin-action btn-admin-primary" 
                    style={{ textDecoration: 'none', padding: '0.5rem 0.9rem', fontSize: '0.85rem' }}
                  >
                    Admin Panel
                  </a>
                )}
                <span className="user-nav-email" style={{ fontSize: '0.85rem' }} title={user.email}>{user.email}</span>
                <button className="btn-signout" onClick={handleSignOut}>Sign Out</button>
              </div>
            ) : (
              <a 
                href="/auth" 
                className="btn-details" 
                style={{ textDecoration: 'none', marginRight: '1rem', padding: '0.5rem 1rem', fontSize: '0.85rem', border: '1px solid var(--color-border-gold)', color: 'var(--color-gold-bright)' }}
              >
                Sign In
              </a>
            )}

            <button 
              className="inquiry-badge-btn"
              id="inquiry-bag-trigger"
              onClick={() => setIsBagOpen(true)}
              aria-label="Open Inquiry Bag"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/>
              </svg>
              Inquiry Bag
              {inquiryBag.length > 0 && (
                <span className="badge-count" id="bag-count-badge">{inquiryBag.length}</span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="hero">
        <div className="hero-background-mandala" aria-hidden="true"></div>
        <div className="hero-content">
          <div className="hero-tagline">Exquisite Traditional Wear</div>
          <h1 className="hero-title">
            Celebrate Festivals in <span className="gold-gradient-text">Nine Colors of Elegance</span>
          </h1>
          <p className="hero-description">
            Explore premium handcrafted Chaniya Cholis, traditional Home Decor, and ethnic Cushion Covers. Choose your favorites and inquire instantly on WhatsApp.
          </p>
          <a href="#catalog" className="hero-cta-btn" id="explore-collection-btn">
            Explore Collection
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
            </svg>
          </a>
        </div>
      </section>

      {/* MAIN CATALOG */}
      <main className="main-content" id="catalog">
        {/* Filters and Search */}
        <section className="filter-section">
          <div className="search-bar-container">
            <span className="search-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" fill="currentColor" viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
              </svg>
            </span>
            <input 
              type="text" 
              className="search-input"
              id="search-products-input"
              placeholder="Search by name, fabric, or work type..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="category-tabs">
            <button 
              className={`category-tab ${selectedCategory === 'all' ? 'active' : ''}`}
              id="filter-tab-all"
              onClick={() => setSelectedCategory('all')}
            >
              All Collection
            </button>
            <button 
              className={`category-tab ${selectedCategory === 'chaniya-choli' ? 'active' : ''}`}
              id="filter-tab-chaniya-choli"
              onClick={() => setSelectedCategory('chaniya-choli')}
            >
              Chaniya Choli
            </button>
            <button 
              className={`category-tab ${selectedCategory === 'home-decor' ? 'active' : ''}`}
              id="filter-tab-home-decor"
              onClick={() => setSelectedCategory('home-decor')}
            >
              Home Decor
            </button>
            <button 
              className={`category-tab ${selectedCategory === 'cushion-covers' ? 'active' : ''}`}
              id="filter-tab-cushion-covers"
              onClick={() => setSelectedCategory('cushion-covers')}
            >
              Cushion Covers
            </button>
          </div>
        </section>

        {/* Catalog Header */}
        <div className="catalog-header">
          <h2 className="catalog-title">Our Exclusive Pieces</h2>
          <p className="catalog-subtitle">Showing {filteredProducts.length} premium handcrafted designs</p>
        </div>

        {/* Product Grid */}
        <section className="product-grid">
          {filteredProducts.map((product) => (
            <article className="product-card" key={product.id}>
              {product.tag && <span className="product-tag">{product.tag}</span>}
              
              <div 
                className="product-image-container"
                onClick={() => openProductDetails(product)}
              >
                <Image 
                  src={product.image} 
                  alt={product.name}
                  width={350}
                  height={350}
                  className="product-image"
                />
              </div>

              <div className="product-info">
                <span className="product-category">{formatCategory(product.category)}</span>
                <h3 
                  className="product-name"
                  onClick={() => openProductDetails(product)}
                >
                  {product.name}
                </h3>
                <p className="product-work-type">{product.workType}</p>
                
                <div className="product-price-row">
                  <span className="product-price">₹{product.price.toLocaleString('en-IN')}</span>
                  <span className="product-original-price">₹{product.originalPrice.toLocaleString('en-IN')}</span>
                  <span className="product-discount">({product.discount}% OFF)</span>
                </div>

                <div className="product-card-actions">
                  <button 
                    className="btn-details"
                    id={`btn-details-${product.id}`}
                    onClick={() => openProductDetails(product)}
                  >
                    View Specs
                  </button>
                  <button 
                    className="btn-inquire"
                    id={`btn-inquire-card-${product.id}`}
                    onClick={(e) => openSingleInquiry(product, e)}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" viewBox="0 0 24 24" style={{marginRight: '2px'}}>
                      <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                    </svg>
                    Inquire
                  </button>
                </div>
                
                <button 
                  className="btn-add-bag"
                  style={{ width: '100%', marginTop: '0.75rem' }}
                  id={`btn-add-bag-${product.id}`}
                  onClick={(e) => handleAddToBag(product, e)}
                >
                  + Add to Bag
                </button>
              </div>
            </article>
          ))}

          {filteredProducts.length === 0 && (
            <div style={{gridColumn: '1/-1', textAlign: 'center', padding: '4rem 0', color: 'var(--color-text-muted)'}}>
              <p style={{fontSize: '1.2rem', marginBottom: '1rem'}}>No Chaniya Cholis found matching your search.</p>
              <button 
                className="category-tab"
                onClick={() => { setSelectedCategory('all'); setSearchQuery(''); }}
              >
                Reset Filters
              </button>
            </div>
          )}
        </section>
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="brand-logo-text" style={{fontSize: '2rem'}}>MAGIC THREADS</span>
            <div className="brand-logo-sub" style={{marginTop: '-6px', letterSpacing: '1px', textTransform: 'lowercase', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.95rem'}}>where magic meets tradition</div>
            <p className="footer-brand-desc" style={{marginTop: '1rem'}}>
              Elegance woven into threads. We specialize in bringing you the most beautiful, authentic, and modern Gujarati designer Chaniya Cholis for Navratri, weddings, and special events.
            </p>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">Categories</h4>
            <ul className="footer-links">
              <li><a href="#catalog" onClick={() => setSelectedCategory('chaniya-choli')}>Chaniya Choli</a></li>
              <li><a href="#catalog" onClick={() => setSelectedCategory('home-decor')}>Home Decor</a></li>
              <li><a href="#catalog" onClick={() => setSelectedCategory('cushion-covers')}>Cushion Covers</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">How to Order</h4>
            <div className="footer-contact-info">
              <p>1. Select your favorite Chaniya Cholis.</p>
              <p>2. Click <strong>Inquire Now</strong> or add multiple items to your <strong>Inquiry Bag</strong>.</p>
              <p>3. Submit the details form to launch WhatsApp.</p>
              <p>4. Chat with us to select custom blouse stitching and finalize delivery details!</p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Magic Threads. All rights reserved.</p>
          <p>Handcrafted with Love for Navratri & Indian Weddings</p>
        </div>
      </footer>

      {/* PRODUCT DETAILS MODAL */}
      {selectedProduct && (
        <div 
          className="modal-backdrop"
          onClick={closeProductDetails}
          id="product-details-modal-backdrop"
        >
          <div 
            className="modal-window"
            onClick={(e) => e.stopPropagation()}
            id="product-details-modal-window"
          >
            <button 
              className="modal-close-btn"
              onClick={closeProductDetails}
              aria-label="Close Modal"
            >
              &times;
            </button>

            <div className="modal-content-details">
              <div className="modal-image-panel">
                <div className="modal-main-image-wrapper">
                  {activeMedia && activeMedia.type === 'video' ? (
                    <video 
                      src={activeMedia.url} 
                      controls 
                      autoPlay 
                      loop 
                      muted
                      className="modal-main-video"
                    />
                  ) : (
                    <Image 
                      src={activeMedia?.url || selectedProduct.image} 
                      alt={selectedProduct.name}
                      width={400}
                      height={500}
                      className="modal-main-image"
                      priority
                    />
                  )}
                </div>

                {/* Thumbnail Gallery (shown only if there are secondary images or a video) */}
                {((selectedProduct.images && selectedProduct.images.length > 0) || selectedProduct.video) && (
                  <div className="modal-thumbnails">
                    {/* Video Thumbnail (Shown First) */}
                    {selectedProduct.video && (
                      <div 
                        className={`thumbnail-item ${activeMedia?.type === 'video' ? 'active' : ''}`}
                        onClick={() => setActiveMedia({ type: 'video', url: selectedProduct.video! })}
                      >
                        <img 
                          src={selectedProduct.image} 
                          alt={`${selectedProduct.name} video preview`}
                          className="thumbnail-img"
                        />
                        <div className="thumbnail-video-overlay">
                          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                          </svg>
                        </div>
                      </div>
                    )}

                    {/* Primary Image Thumbnail */}
                    <div 
                      className={`thumbnail-item ${activeMedia?.type === 'image' && activeMedia.url === selectedProduct.image ? 'active' : ''}`}
                      onClick={() => setActiveMedia({ type: 'image', url: selectedProduct.image })}
                    >
                      <img 
                        src={selectedProduct.image} 
                        alt={`${selectedProduct.name} main`}
                        className="thumbnail-img"
                      />
                    </div>

                    {/* Secondary Images Thumbnails */}
                    {selectedProduct.images && selectedProduct.images.map((imgUrl, idx) => {
                      // Skip if it is the same as primary image (since we already displayed it)
                      if (imgUrl === selectedProduct.image) return null;
                      return (
                        <div 
                          key={idx}
                          className={`thumbnail-item ${activeMedia?.type === 'image' && activeMedia.url === imgUrl ? 'active' : ''}`}
                          onClick={() => setActiveMedia({ type: 'image', url: imgUrl })}
                        >
                          <img 
                            src={imgUrl} 
                            alt={`${selectedProduct.name} gallery ${idx + 1}`}
                            className="thumbnail-img"
                          />
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="modal-info-panel">
                <div className="modal-title-row">
                  <span className="product-category">{formatCategory(selectedProduct.category)}</span>
                  <h2 className="modal-title">{selectedProduct.name}</h2>
                </div>

                <div className="modal-price-row">
                  <span className="product-price" style={{fontSize: '2rem'}}>₹{selectedProduct.price.toLocaleString('en-IN')}</span>
                  <span className="product-original-price" style={{fontSize: '1.2rem'}}>₹{selectedProduct.originalPrice.toLocaleString('en-IN')}</span>
                  <span className="product-discount" style={{fontSize: '1.1rem'}}>({selectedProduct.discount}% OFF)</span>
                </div>

                <p className="modal-desc">{selectedProduct.description}</p>

                <h4 style={{fontFamily: 'var(--font-sans)', fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-text-muted)', marginBottom: '0.5rem', fontWeight: 600}}>
                  Product Specifications
                </h4>
                
                <table className="specs-table">
                  <tbody>
                    <tr>
                      <td className="spec-label">Fabric / Material</td>
                      <td className="spec-val">{selectedProduct.fabric}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Embroidery & Work</td>
                      <td className="spec-val">{selectedProduct.workType}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Lehenga Ghera (Flare)</td>
                      <td className="spec-val">{selectedProduct.flare}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Blouse Style</td>
                      <td className="spec-val">{selectedProduct.blouse}</td>
                    </tr>
                    <tr>
                      <td className="spec-label">Dupatta Detail</td>
                      <td className="spec-val">{selectedProduct.dupatta}</td>
                    </tr>
                  </tbody>
                </table>



                <div style={{display: 'flex', gap: '1rem', marginTop: 'auto'}}>
                  <button 
                    className="btn-inquire"
                    style={{flexGrow: 2, padding: '1rem'}}
                    id="modal-inquire-now-btn"
                    onClick={() => {
                      // Open inquiry
                      setInquiryProduct(selectedProduct);
                      setIsBulkInquiry(false);
                      setShowInquiryModal(true);
                      closeProductDetails();
                    }}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{marginRight: '4px'}}>
                      <path d="M20 2H4c-1.1 0-1.99.9-1.99 2L2 22l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zM6 9h12v2H6V9zm8 5H6v-2h8v2zm4-6H6V6h12v2z"/>
                    </svg>
                    Inquire on WhatsApp
                  </button>
                  
                  <button
                    className="btn-add-bag"
                    style={{flexGrow: 1, padding: '1rem'}}
                    id="modal-add-bag-btn"
                    onClick={(e) => {
                      handleAddToBag(selectedProduct, e);
                      closeProductDetails();
                    }}
                  >
                    + Add to Bag
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* INQUIRY FORM MODAL */}
      {showInquiryModal && (
        <div 
          className="modal-backdrop"
          onClick={closeInquiryModal}
          id="inquiry-form-modal-backdrop"
        >
          <div 
            className="modal-window modal-window-small"
            onClick={(e) => e.stopPropagation()}
            id="inquiry-form-modal-window"
          >
            <button 
              className="modal-close-btn"
              onClick={closeInquiryModal}
              aria-label="Close Modal"
            >
              &times;
            </button>

            <div className="inquiry-form-header">
              <h2 className="inquiry-form-title">
                {isBulkInquiry ? "Send Bulk Inquiry" : "Send Product Inquiry"}
              </h2>
              <p className="inquiry-form-sub">
                {isBulkInquiry 
                  ? `Inquiring about ${inquiryBag.length} Chaniya Cholis` 
                  : `For: ${inquiryProduct?.name}`}
              </p>
            </div>

            <form onSubmit={handleSubmitInquiry} className="inquiry-form">
              {/* Product summary card (Only for single product) */}
              {!isBulkInquiry && inquiryProduct && (
                <div className="product-summary-card">
                  <div className="product-summary-img-wrapper">
                    <Image 
                      src={inquiryProduct.image} 
                      alt={inquiryProduct.name}
                      width={60}
                      height={60}
                      className="product-summary-img"
                    />
                  </div>
                  <div className="product-summary-details">
                    <span className="product-summary-name">{inquiryProduct.name}</span>
                    <span className="product-summary-price">₹{inquiryProduct.price.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              )}

              <div className="form-group">
                <label className="form-label" htmlFor="inquiry-user-name">Your Full Name *</label>
                <input 
                  type="text" 
                  id="inquiry-user-name" 
                  className="form-input"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="inquiry-user-phone">WhatsApp Number (Optional)</label>
                <input 
                  type="tel" 
                  id="inquiry-user-phone" 
                  className="form-input"
                  placeholder="e.g. +91 98765 43210"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                />
              </div>



              <div className="form-group">
                <label className="form-label" htmlFor="inquiry-user-notes">Custom Notes / Special Instructions</label>
                <textarea 
                  id="inquiry-user-notes" 
                  className="form-input form-textarea"
                  placeholder="Any customization requirements (e.g. neck depth, sleeve length, borders, or general questions)..."
                  value={customNotes}
                  onChange={(e) => setCustomNotes(e.target.value)}
                />
              </div>

              <button 
                type="submit" 
                className="btn-submit-inquiry"
                id="submit-whatsapp-inquiry-btn"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path fillRule="evenodd" d="M12.01 2.012a9.96 9.96 0 0 0-4.992 1.332L3 2.127l1.246 3.842a9.962 9.962 0 0 0-1.234 4.814c0 5.518 4.49 10.007 10.007 10.007 5.519 0 10.007-4.49 10.007-10.007s-4.488-10.007-10.007-10.007zm5.289 13.064c-.22.617-1.077 1.144-1.636 1.217-.552.072-1.282.115-2.029-.12-.472-.152-1.04-.388-1.782-.71-3.155-1.367-5.184-4.573-5.342-4.782-.158-.21-1.284-1.71-1.284-3.264 0-1.554.814-2.317 1.104-2.618.29-.3.633-.377.844-.377.21 0 .422.002.606.01.19.008.448-.073.7.538.264.64.9 2.19.979 2.352.079.162.132.35.026.562-.105.213-.158.347-.317.528-.158.18-.333.376-.475.526-.145.154-.296.322-.128.61.168.288.747 1.233 1.6 1.996.853.762 1.57 1.006 1.833 1.137.264.13.42.11.578-.073.158-.182.686-.798.87-1.073.185-.275.37-.23.623-.136.254.095 1.61.76 1.887.897.277.138.462.207.528.322.066.115.066.666-.154 1.283z" clipRule="evenodd"/>
                </svg>
                Open WhatsApp & Chat
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SLIDE-OVER INQUIRY BAG PANEL */}
      {isBagOpen && (
        <div 
          className="modal-backdrop"
          onClick={() => setIsBagOpen(false)}
          id="cart-panel-backdrop"
          style={{padding: 0, justifyContent: 'flex-end'}}
        >
          <div 
            className="cart-panel"
            onClick={(e) => e.stopPropagation()}
            id="cart-panel-window"
          >
            <div className="cart-header">
              <h2 className="cart-title">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" fill="var(--color-gold)" viewBox="0 0 24 24">
                  <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/>
                </svg>
                Inquiry Bag
              </h2>
              <button 
                className="modal-close-btn"
                style={{position: 'static', width: '30px', height: '30px'}}
                onClick={() => setIsBagOpen(false)}
              >
                &times;
              </button>
            </div>

            <div className="cart-items-list">
              {inquiryBag.map((item) => (
                <div className="cart-item" key={item.id}>
                  <div className="cart-item-img-wrapper">
                    <Image 
                      src={item.image} 
                      alt={item.name}
                      width={70}
                      height={70}
                      className="cart-item-img"
                    />
                  </div>
                  <div className="cart-item-details">
                    <span className="cart-item-name">{item.name}</span>
                    <span className="cart-item-price">₹{item.price.toLocaleString('en-IN')}</span>
                    <span className="cart-item-meta">{item.fabric}</span>
                  </div>
                  <button 
                    className="cart-item-remove-btn"
                    id={`btn-remove-item-${item.id}`}
                    onClick={(e) => handleRemoveFromBag(item.id, e)}
                    aria-label="Remove item"
                  >
                    &times;
                  </button>
                </div>
              ))}

              {inquiryBag.length === 0 && (
                <div className="empty-cart-view">
                  <span className="empty-cart-icon">
                    <svg xmlns="http://www.w3.org/2000/svg" width="60" height="60" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6h-2c0-2.76-2.24-5-5-5S7 3.24 7 6H5c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7-3c1.66 0 3 1.34 3 3H9c0-1.66 1.34-3 3-3zm7 17H5V8h14v12z"/>
                    </svg>
                  </span>
                  <p>Your inquiry bag is empty.</p>
                  <p style={{fontSize: '0.85rem', color: 'var(--color-text-muted)'}}>
                    Add pieces from our catalog to inquire about them together!
                  </p>
                </div>
              )}
            </div>

            {inquiryBag.length > 0 && (
              <div className="cart-footer">
                <div className="cart-total-row">
                  <span>Selected Items:</span>
                  <span>{inquiryBag.length} Pieces</span>
                </div>
                <div className="cart-total-row" style={{color: 'var(--color-gold-bright)'}}>
                  <span>Est. Value:</span>
                  <span>₹{inquiryBag.reduce((total, item) => total + item.price, 0).toLocaleString('en-IN')}</span>
                </div>
                <button 
                  className="btn-submit-inquiry"
                  style={{marginTop: '0.5rem'}}
                  id="bulk-inquiry-proceed-btn"
                  onClick={openBulkInquiry}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                  Inquire All via WhatsApp
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TOAST SYSTEM */}
      {toastMessage && (
        <div className="toast-message" id="toast-notification">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="var(--color-gold-bright)" viewBox="0 0 24 24">
            <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
          </svg>
          {toastMessage}
        </div>
      )}
    </div>
  );
}
