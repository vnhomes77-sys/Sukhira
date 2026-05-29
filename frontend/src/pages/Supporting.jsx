import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Mail, Phone, MapPin, Send, HelpCircle, Info } from 'lucide-react';

const Supporting = () => {
  const { pathname } = useLocation();

  // Contact Form State
  const [cName, setCName] = useState('');
  const [cEmail, setCEmail] = useState('');
  const [cMessage, setCMessage] = useState('');
  const [cSubmitted, setCSubmitted] = useState(false);

  const handleContactSubmit = (e) => {
    e.preventDefault();
    if (cName && cEmail && cMessage) {
      setCSubmitted(true);
      setCName('');
      setCEmail('');
      setCMessage('');
      setTimeout(() => setCSubmitted(false), 5000);
      alert('Your enquiry has been received! Our support representatives will reach out in 24 hours.');
    }
  };

  const [faqOpen, setFaqOpen] = useState({});

  const toggleFaq = (idx) => {
    setFaqOpen({ ...faqOpen, [idx]: !faqOpen[idx] });
  };

  const getPageContent = () => {
    if (pathname.includes('/about')) {
      return {
        title: 'About Sukhira',
        icon: <Info size={28} />,
        body: (
          <div>
            <p><strong>Welcome to Sukhira.</strong> We believe that our clothing, active accessories, and skincare routines should not be static. The external environment and temperature change drastically depending on the weather outside—and so does our body's physiology.</p>
            <p>Our mission is to help you stay ahead of the weather. We carefully research and curate catalogs of high-quality Merino knits for Winter, breathable flax linens and UV blockers for Summer, and quick-dry athleisure gear for Monsoon. Along with apparel, we spotlight scientific, dermatologist-tested skincare routines optimized specifically to guard your skin barrier against dry cold, strong summer sun, and humid monsoon waters.</p>
            <h3>Our Curations</h3>
            <p>Each season has its own unique, tailormade design store highlighting products to tackle the weather head-on. At Sukhira, we want you to feel comfortable, look stunning, and maintain healthy glowing skin all year round.</p>
          </div>
        )
      };
    } else if (pathname.includes('/contact')) {
      return {
        title: 'Contact Us',
        icon: <Mail size={28} />,
        body: (
          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '2rem' }}>
            {/* Contact Form */}
            <div>
              <h4 style={{ fontWeight: 700, marginBottom: '1rem' }}>Send Us a Message</h4>
              <form onSubmit={handleContactSubmit} className="add-review-form" style={{ background: 'transparent', border: 'none', padding: 0 }}>
                <div className="form-group">
                  <label>Your Name</label>
                  <input type="text" placeholder="e.g. Priyesh Patel" value={cName} onChange={(e) => setCName(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="customer@example.com" value={cEmail} onChange={(e) => setCEmail(e.target.value)} required />
                </div>
                <div className="form-group">
                  <label>Message / Query</label>
                  <textarea rows="5" placeholder="How can we help you prepare for this season?" value={cMessage} onChange={(e) => setCMessage(e.target.value)} required></textarea>
                </div>
                <button type="submit" className="btn-primary" style={{ display: 'flex', gap: '0.4rem', width: 'auto' }}>
                  <Send size={16} />
                  <span>Send Message</span>
                </button>
                {cSubmitted && <span style={{ color: 'var(--accent-color)', display: 'block', marginTop: '0.5rem', fontWeight: 'bold' }}>✓ Message sent successfully!</span>}
              </form>
            </div>
            
            {/* Direct Contact Details */}
            <div style={{ borderLeft: '1px solid var(--border-color)', paddingLeft: '2rem' }}>
              <h4 style={{ fontWeight: 700, marginBottom: '1.5rem' }}>Direct Support</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', fontSize: '0.95rem' }}>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <Phone size={18} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                  <div>
                    <strong>Phone Support:</strong>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>+91 98765 43210</p>
                    <p style={{ color: 'var(--text-muted)' }}>Mon - Sat: 9 AM - 6 PM</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <Mail size={18} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                  <div>
                    <strong>Email Address:</strong>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>support@sukhira.com</p>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.8rem' }}>
                  <MapPin size={18} style={{ color: 'var(--accent-color)', flexShrink: 0 }} />
                  <div>
                    <strong>HQ Location:</strong>
                    <p style={{ color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                      Sukhira House, 4th Block, Koramangala,<br />
                      Bengaluru, Karnataka - 560034
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      };
    } else if (pathname.includes('/shipping')) {
      return {
        title: 'Shipping Policy',
        icon: <Info size={28} />,
        body: (
          <div>
            <p>At Sukhira, we want to deliver your seasonal essentials quickly so you are protected against current climate conditions. Please review our shipping guidelines:</p>
            <h3>Delivery Timeline</h3>
            <p>All orders are processed within 24 hours. We partner with India's leading logistics providers to ensure delivery to major metropolitan areas within 3–5 business days, and other states within 5–7 business days.</p>
            <h3>Shipping Rates</h3>
            <ul>
              <li><strong>Orders above ₹999:</strong> Free standard shipping across India.</li>
              <li><strong>Orders below ₹999:</strong> Flat shipping charge of ₹99.</li>
            </ul>
            <h3>Tracking Details</h3>
            <p>Once your order is shipped, a unique 16-character tracking reference ID (e.g. SUK-20260529-XXXX) will be sent to your registered email and mobile number. You can trace its live progress using our dedicated tracking portal.</p>
          </div>
        )
      };
    } else if (pathname.includes('/return')) {
      return {
        title: 'Return & Refund Policy',
        icon: <Info size={28} />,
        body: (
          <div>
            <p>We want you to love your seasonal cutes. If you are not fully satisfied, we offer a hassle-free return and refund policy:</p>
            <h3>7-Day Window</h3>
            <p>You can raise a return or exchange request within 7 days from the date of delivery. All apparel must be unused, unwashed, and returned in their original packaging with tags intact.</p>
            <h3>Skincare & Beauty Returns</h3>
            <p>For safety and hygiene, skincare and personal hygiene items can only be returned if they are delivered damaged, defective, or expired, or if they trigger a dermatologist-certified skin irritation. Please contact support immediately in such cases.</p>
            <h3>Refund Method</h3>
            <p>Once your return is picked up and passes our warehouse quality checks, refunds are processed within 3 business days to your original payment method (Card/UPI) or credited as bank transfers for Cash on Delivery orders.</p>
          </div>
        )
      };
    } else {
      // FAQ
      const FAQs = [
        { q: 'How does the season toggle work?', a: 'Sukhira features three dynamic seasonal sections: Winter, Summer, and Monsoon. Toggling the season tabs in the navbar changes the entire store aesthetic, typography, and product recommendations to fit the current weather conditions.' },
        { q: 'Are your skincare products clinically tested?', a: 'Yes. All our seasonal skincare spotlight products are formulated with clinical dermatological ingredients (such as Ceramides for winter barrier recovery, Tea Tree for monsoon oil-control, and physical filters for summer sun defense). They are non-comedogenic and hypoallergenic.' },
        { q: 'How can I track my package?', a: 'Simply enter your order reference ID (sent via SMS/Email) in the Search bar of the "Track Order" page to view the live status timeline of your shipment.' },
        { q: 'Do you offer cash on delivery (COD)?', a: 'Yes, we offer Cash on Delivery (COD) services across all pincodes in India. We also support secure UPI and Credit/Debit card payments during checkout.' }
      ];
      return {
        title: 'Frequently Asked Questions (FAQ)',
        icon: <HelpCircle size={28} />,
        body: (
          <div className="accordion-container" style={{ maxWidth: '100%' }}>
            {FAQs.map((faq, idx) => {
              const isOpen = !!faqOpen[idx];
              return (
                <div key={idx} className="accordion-item">
                  <div className="accordion-header" onClick={() => toggleFaq(idx)} style={{ fontSize: '1rem', fontWeight: 'bold' }}>
                    <span>{faq.q}</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: '1.2rem 1.8rem', background: 'var(--bg-hover)', borderTop: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      };
    }
  };

  const content = getPageContent();

  return (
    <div className="supporting-page">
      <h1>{content.title}</h1>
      <div className="supporting-page-content">
        {content.body}
      </div>
    </div>
  );
};

export default Supporting;
