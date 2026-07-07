'use client';

import React, { useState } from 'react';

const SELLER_WHATSAPP_NUMBER = '918980082662';

export default function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [inquiryType, setInquiryType] = useState('General Inquiry');
  const [message, setMessage] = useState('');
  const [formSubmitted, setFormSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      alert("Please enter your name");
      return;
    }

    // Formulate a beautiful WhatsApp text template
    const messageText = `✨ *Magic Threads - New Contact Us Message* ✨\n\n` +
      `👤 *Name:* ${name.trim()}\n` +
      `📧 *Email:* ${email.trim() || 'N/A'}\n` +
      `📞 *Phone:* ${phone.trim() || 'N/A'}\n` +
      `📌 *Inquiry Type:* ${inquiryType}\n\n` +
      `💬 *Message:* \n${message.trim()}\n\n` +
      `Please let me know how I can proceed. Thank you!`;

    // Encode message and create WhatsApp URL
    const encodedText = encodeURIComponent(messageText);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${SELLER_WHATSAPP_NUMBER}&text=${encodedText}`;

    // Open WhatsApp
    window.open(whatsappUrl, '_blank');
    setFormSubmitted(true);

    // Reset form fields
    setName('');
    setEmail('');
    setPhone('');
    setInquiryType('General Inquiry');
    setMessage('');

    setTimeout(() => {
      setFormSubmitted(false);
    }, 5000);
  };

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        <div className="nav-container">
          <a href="/" className="brand-logo" id="header-logo-link" style={{ display: 'flex', alignItems: 'center', gap: '0.9rem', textDecoration: 'none' }}>
            <img src="/images/logo.png" alt="Magic Threads Logo" style={{ width: '64px', height: '64px', borderRadius: '50%', border: '2px solid var(--color-gold)', boxShadow: '0 0 10px rgba(197, 155, 39, 0.3)' }} />
            <div>
              <span className="brand-logo-text" style={{ display: 'block', fontSize: '1.4rem', fontWeight: '700', letterSpacing: '1.5px' }}>MAGIC THREADS</span>
              <div className="brand-logo-sub" style={{ fontSize: '0.68rem', letterSpacing: '0.2px', textTransform: 'lowercase', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>where magic meets tradition</div>
            </div>
          </a>

          <nav>
            <ul className="nav-links">
              <li>
                <a href="/" className="nav-link">Catalog</a>
              </li>
              <li>
                <a href="/contact" className="nav-link">Contact Us</a>
              </li>
            </ul>
          </nav>
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="contact-hero">
        <div className="hero-background-mandala" aria-hidden="true"></div>
        <div className="hero-content">
          <div className="hero-tagline">Get in Touch</div>
          <h1 className="hero-title">
            We'd Love to <span className="gold-gradient-text">Hear From You</span>
          </h1>
          <p className="hero-description">
            Have questions about sizes, customization, stitching, or shipping? Reach out, and we will get back to you immediately!
          </p>
        </div>
      </section>

      {/* MAIN CONTENT */}
      <main className="main-content">
        <div className="contact-layout">
          {/* Info Card Column */}
          <div className="contact-card">
            <h2 style={{ fontSize: '1.8rem', marginBottom: '1.5rem', fontFamily: 'var(--font-serif)' }}>Contact Information</h2>
            <p style={{ color: 'var(--color-text-secondary)', marginBottom: '2.5rem', fontSize: '0.95rem', lineHeight: '1.6' }}>
              Feel free to visit our store in Ahmedabad, drop us an email, or send us a WhatsApp message directly for quick answers.
            </p>

            <div className="contact-info-item">
              <div className="contact-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </div>
              <div className="contact-info-details">
                <h3>Follow Us</h3>
                <p><a href="https://instagram.com/magicthreads" target="_blank" rel="noopener noreferrer">@magicthreads</a></p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-wrapper">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                  <polyline points="22,6 12,13 2,6"></polyline>
                </svg>
              </div>
              <div className="contact-info-details">
                <h3>Email Support</h3>
                <p><a href="mailto:nishakansara2703@gmail.com">nishakansara2703@gmail.com</a></p>
              </div>
            </div>

            <div className="contact-info-item">
              <div className="contact-icon-wrapper" style={{ backgroundColor: 'rgba(37, 211, 102, 0.1)', color: '#25D366', borderColor: 'rgba(37, 211, 102, 0.2)' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <rect width="24" height="24" rx="6" fill="#25D366" />
                  <path fill="#FFFFFF" d="M17.6 15.6c-.3-.2-1.7-1-2-.1-.3.3-.5.7-.6.9-.2.2-.4.2-.7 0-.3-.2-1.4-.7-2.7-2-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.2-.7l.4-.5c.1-.1.2-.2.2-.3s.1-.2 0-.3c-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6H8.2c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.5 4 1.7 4.3c.2.3 2.9 4.5 7.1 6.3 1 .4 1.8.7 2.4.9 1 .3 2 .3 2.7.2.8-.1 2.5-1 2.9-2 .4-.9.4-1.7.3-1.9-.1-.2-.4-.3-.7-.5z" />
                </svg>
              </div>
              <div className="contact-info-details">
                <h3>WhatsApp Chat</h3>
                <p><a href={`https://api.whatsapp.com/send?phone=${SELLER_WHATSAPP_NUMBER}`} target="_blank" rel="noopener noreferrer">+91 8980082662</a></p>
              </div>
            </div>


          </div>

          {/* Form Card Column */}
          <div className="contact-card contact-form-card">
            <h2 className="contact-form-title">Send a Message</h2>
            <p className="contact-form-subtitle">Fill in the details below, and click submit to send the details directly to our team via WhatsApp.</p>

            {formSubmitted && (
              <div style={{ backgroundColor: 'rgba(39, 174, 96, 0.1)', border: '1px solid #27ae60', borderRadius: '12px', padding: '1rem', color: '#27ae60', marginBottom: '2rem', fontSize: '0.95rem' }}>
                <strong>Success!</strong> Your inquiry has been prepared. WhatsApp should have opened in a new tab to complete sending your message.
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div className="contact-form-grid">
                <div className="contact-form-group">
                  <label className="contact-form-label" htmlFor="contact-name">Full Name *</label>
                  <input
                    type="text"
                    id="contact-name"
                    className="contact-form-input"
                    placeholder="Enter your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>

                <div className="contact-form-group">
                  <label className="contact-form-label" htmlFor="contact-email">Email Address</label>
                  <input
                    type="email"
                    id="contact-email"
                    className="contact-form-input"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="contact-form-group">
                  <label className="contact-form-label" htmlFor="contact-phone">Phone Number</label>
                  <input
                    type="tel"
                    id="contact-phone"
                    className="contact-form-input"
                    placeholder="Enter phone number"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>

                <div className="contact-form-group">
                  <label className="contact-form-label" htmlFor="contact-subject">Inquiry Type</label>
                  <select
                    id="contact-subject"
                    className="contact-form-select"
                    value={inquiryType}
                    onChange={(e) => setInquiryType(e.target.value)}
                  >
                    <option value="General Inquiry">General Inquiry</option>
                    <option value="Custom Stitching / Alterations">Custom Stitching / Alterations</option>
                    <option value="Bulk / Wholesale Orders">Bulk / Wholesale Orders</option>
                    <option value="Delivery / Shipping Status">Delivery / Shipping Status</option>
                  </select>
                </div>

                <div className="contact-form-group contact-form-grid-full">
                  <label className="contact-form-label" htmlFor="contact-message">Message *</label>
                  <textarea
                    id="contact-message"
                    className="contact-form-textarea"
                    placeholder="Tell us what you are looking for..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  ></textarea>
                </div>
              </div>

              <button type="submit" className="contact-submit-btn">
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" fill="currentColor" viewBox="0 0 24 24" style={{ marginRight: '4px' }}>
                  <rect width="24" height="24" rx="6" fill="#25D366" />
                  <path fill="#FFFFFF" d="M17.6 15.6c-.3-.2-1.7-1-2-.1-.3.3-.5.7-.6.9-.2.2-.4.2-.7 0-.3-.2-1.4-.7-2.7-2-1-.9-1.7-2-1.9-2.3-.2-.3 0-.5.2-.7l.4-.5c.1-.1.2-.2.2-.3s.1-.2 0-.3c-.1-.2-.8-2-1.1-2.7-.3-.7-.6-.6-.8-.6H8.2c-.3 0-.7.1-1.1.5-.4.4-1.4 1.4-1.4 3.4s1.5 4 1.7 4.3c.2.3 2.9 4.5 7.1 6.3 1 .4 1.8.7 2.4.9 1 .3 2 .3 2.7.2.8-.1 2.5-1 2.9-2 .4-.9.4-1.7.3-1.9-.1-.2-.4-.3-.7-.5z" />
                </svg>
                Send via WhatsApp
              </button>
            </form>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="app-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <span className="brand-logo-text" style={{ fontSize: '2rem' }}>MAGIC THREADS</span>
            <div className="brand-logo-sub" style={{ marginTop: '-6px', letterSpacing: '1px', textTransform: 'lowercase', fontFamily: 'var(--font-serif)', fontStyle: 'italic', fontSize: '0.95rem' }}>where magic meets tradition</div>
            <p className="footer-brand-desc" style={{ marginTop: '1rem' }}>
              Elegance woven into threads. We specialize in bringing you the most beautiful, authentic, and modern Gujarati designer Chaniya Cholis for Navratri, weddings, and special events.
            </p>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">Quick Links</h4>
            <ul className="footer-links">
              <li><a href="/">Catalog</a></li>
              <li><a href="/contact">Contact Us</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h4 className="footer-col-title">Boutique Hours</h4>
            <div className="footer-contact-info" style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <p>Monday - Saturday: 11:00 AM - 8:00 PM</p>
              <p>Sunday: Closed</p>
              <p><em>Prior appointments recommended for custom stitching consultations.</em></p>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} Magic Threads. All rights reserved.</p>
          <p>Handcrafted with Love for Navratri & Indian Weddings</p>
        </div>
      </footer>
    </div>
  );
}
