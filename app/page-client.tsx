'use client';

import { useState, useEffect } from 'react';
import CheckoutModal from '@/components/CheckoutModal';
import { 
  Sparkles, 
  ArrowLeft, 
  Star, 
  ShieldCheck, 
  Heart, 
  Lock, 
  Gift, 
  Cloud,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

interface Section {
  id: string;
  type: string;
  tag?: string;
  title?: string;
  subtitle?: string;
  subtext?: string;
  buttonText?: string;
  priceText?: string;
  badges?: string[];
  backgroundImage?: string;
  content?: string;
  imageUrl?: string;
  position?: 'left' | 'right';
  topTexts?: string[];
  images?: string[];
  bottomTexts?: string[];
  items?: any[];
  stats?: any[];
}

interface LandingPageClientProps {
  initialSections: Section[];
  checkoutFields: any[];
  price: number;
}

export default function LandingPageClient({ initialSections, checkoutFields, price }: LandingPageClientProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const [currentImageIdxs, setCurrentImageIdxs] = useState<Record<string, number>>({});

  // Parse `{text}` inside strings and replace with a glowing gradient span
  const renderTitle = (text?: string) => {
    if (!text) return null;
    const parts = text.split(/(\{[^}]+\})/g);
    return parts.map((part, i) => {
      if (part.startsWith('{') && part.endsWith('}')) {
        return (
          <span key={i} className="text-highlight">
            {part.slice(1, -1)}
          </span>
        );
      }
      return part;
    });
  };

  // Helper to render dynamic feature icons
  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'lock': return <Lock size={28} color="#ec4899" />;
      case 'heart': return <Heart size={28} color="#ec4899" />;
      case 'gift': return <Gift size={28} color="#ec4899" />;
      case 'cloud': return <Cloud size={28} color="#ec4899" />;
      default: return <ShieldCheck size={28} color="#ec4899" />;
    }
  };

  // Autoplay handler for the middle image slider of the triple-slider sections
  useEffect(() => {
    const sliders = initialSections.filter(s => s.type === 'triple-slider');
    if (sliders.length === 0) return;

    const interval = setInterval(() => {
      setCurrentImageIdxs(prev => {
        const updated = { ...prev };
        sliders.forEach(slider => {
          const imgsCount = slider.images?.length || 0;
          if (imgsCount > 0) {
            const currentIdx = prev[slider.id] || 0;
            updated[slider.id] = (currentIdx + 1) % imgsCount;
          }
        });
        return updated;
      });
    }, 4000);

    return () => clearInterval(interval);
  }, [initialSections]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header Navigation */}
      <header
        className="glass-panel"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          padding: '16px 5%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid var(--glass-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <div
            style={{
              background: 'var(--accent-gradient)',
              padding: '6px',
              borderRadius: 'var(--radius-sm)',
              color: '#fff',
              display: 'flex',
            }}
          >
            <Heart size={18} fill="#fff" />
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.25rem', letterSpacing: '0.5px' }}>
            ذكرياتنا
          </span>
        </div>
        <button 
          onClick={() => setModalOpen(true)} 
          className="btn btn-primary" 
          style={{ padding: '8px 20px', fontSize: '0.85rem' }}
        >
          احجز موقعك الآن
        </button>
      </header>

      {/* Landing page sections */}
      <main style={{ flex: 1 }}>
        {initialSections.map((section) => {
          switch (section.type) {
            
            // Hero section matching reference layout
            case 'hero':
              return (
                <section
                  key={section.id}
                  style={{
                    position: 'relative',
                    minHeight: '85vh',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '80px 5%',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ maxWidth: '850px', marginInline: 'auto' }}>
                    {section.tag && (
                      <div className="tag-pill">
                        {section.tag}
                      </div>
                    )}
                    
                    <h1
                      style={{
                        fontSize: '3rem',
                        fontWeight: 900,
                        lineHeight: 1.3,
                        marginBottom: '20px',
                        color: '#ffffff',
                      }}
                    >
                      {renderTitle(section.title)}
                    </h1>
                    
                    <p
                      style={{
                        fontSize: '1.3rem',
                        color: 'var(--text-secondary)',
                        marginBottom: '15px',
                        fontWeight: '600',
                      }}
                    >
                      {section.subtitle}
                    </p>
                    
                    {section.subtext && (
                      <p
                        style={{
                          fontSize: '1.05rem',
                          color: 'var(--text-secondary)',
                          opacity: 0.8,
                          marginBottom: '35px',
                          maxWidth: '650px',
                          marginInline: 'auto',
                        }}
                      >
                        {section.subtext}
                      </p>
                    )}

                    {section.buttonText && (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '15px' }}>
                        <button
                          onClick={() => setModalOpen(true)}
                          className="btn btn-primary"
                          style={{ 
                            fontSize: '1.15rem', 
                            padding: '16px 45px',
                          }}
                        >
                          {section.buttonText}
                        </button>

                        {section.priceText && (
                          <span style={{ fontSize: '0.95rem', color: '#f43f5e', fontWeight: 'bold' }}>
                            {section.priceText}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Stats Counter Bar with Dividers */}
                    {section.stats && section.stats.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'center',
                          alignItems: 'center',
                          flexWrap: 'wrap',
                          gap: '15px',
                          marginTop: '50px',
                          padding: '20px 10px',
                          background: 'rgba(255, 255, 255, 0.02)',
                          border: '1.2px solid var(--glass-border)',
                          borderRadius: 'var(--radius-md)',
                        }}
                      >
                        {section.stats.map((stat: any, sIdx: number) => (
                          <div key={sIdx} style={{ display: 'flex', alignItems: 'center' }}>
                            <div style={{ padding: '0 20px', textAlign: 'center' }}>
                              <div style={{ fontSize: '2.2rem', fontWeight: '900', color: '#fff', fontFamily: 'var(--font-english)' }}>
                                {stat.value}
                              </div>
                              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                                {stat.label}
                              </div>
                            </div>
                            {sIdx < section.stats.length - 1 && (
                              <div style={{ width: '1px', height: '40px', background: 'var(--glass-border)' }} />
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Badges footer Row */}
                    {section.badges && section.badges.length > 0 && (
                      <div
                        style={{
                          display: 'flex',
                          flexWrap: 'wrap',
                          justifyContent: 'center',
                          gap: '24px',
                          marginTop: '45px',
                          color: 'var(--text-secondary)',
                          fontSize: '0.9rem',
                        }}
                      >
                        {section.badges.map((badge, idx) => (
                          <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span>{badge}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </section>
              );

            // Rich Text Section
            case 'rich-text':
              return (
                <section
                  key={section.id}
                  style={{
                    padding: '80px 5%',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ maxWidth: '800px', margin: '0 auto' }}>
                    {section.tag && (
                      <div style={{ color: '#fbbf24', fontSize: '0.95rem', fontWeight: 'bold', marginBottom: '15px' }}>
                        {section.tag}
                      </div>
                    )}
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '20px' }}>
                      {renderTitle(section.title)}
                    </h2>
                    <p
                      style={{
                        color: 'var(--text-secondary)',
                        lineHeight: 1.8,
                        fontSize: '1.15rem',
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {section.content}
                    </p>
                  </div>
                </section>
              );

            // Features cards Grid matching reference Lock/Heart/Gift/Cloud layout
            case 'features':
              return (
                <section
                  key={section.id}
                  style={{
                    padding: '90px 5%',
                  }}
                >
                  <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2
                      style={{
                        textAlign: 'center',
                        fontSize: '2.2rem',
                        fontWeight: 900,
                        marginBottom: '10px',
                      }}
                    >
                      {renderTitle(section.title)}
                    </h2>
                    {section.subtitle && (
                      <p style={{ textAlign: 'center', color: 'var(--text-secondary)', marginBottom: '50px' }}>
                        {section.subtitle}
                      </p>
                    )}
                    
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                        gap: '20px',
                      }}
                    >
                      {section.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="glass-panel"
                          style={{
                            padding: '30px 24px',
                            borderRadius: 'var(--radius-md)',
                            transition: 'var(--transition)',
                          }}
                        >
                          <div
                            style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: 'var(--radius-sm)',
                              background: 'rgba(236, 72, 153, 0.05)',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginBottom: '20px',
                            }}
                          >
                            {renderIcon(item.icon)}
                          </div>
                          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', fontWeight: '800' }}>
                            {item.title}
                          </h3>
                          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.6 }}>
                            {item.description}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );

            // Split grid layout (Text side, image side)
            case 'split-card':
              const isLeft = section.position === 'left';
              return (
                <section
                  key={section.id}
                  style={{
                    padding: '80px 5%',
                  }}
                >
                  <div
                    style={{
                      maxWidth: '1100px',
                      margin: '0 auto',
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
                      gap: '40px',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ order: isLeft ? 2 : 1 }}>
                      {section.tag && (
                        <div style={{ color: 'var(--accent-primary)', fontSize: '0.9rem', fontWeight: 'bold', marginBottom: '15px' }}>
                          {section.tag}
                        </div>
                      )}
                      <h2 style={{ fontSize: '2.2rem', fontWeight: 900, marginBottom: '15px' }}>
                        {renderTitle(section.title)}
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: 1.8 }}>
                        {section.subtitle}
                      </p>
                    </div>
                    {section.imageUrl && (
                      <div style={{ order: isLeft ? 1 : 2, textAlign: 'center' }}>
                        <img
                          src={section.imageUrl}
                          alt="Romantic capsule view"
                          style={{
                            width: '100%',
                            maxHeight: '360px',
                            objectFit: 'cover',
                            borderRadius: 'var(--radius-md)',
                            border: '1.5px solid var(--glass-border)',
                          }}
                        />
                      </div>
                    )}
                  </div>
                </section>
              );

            // Custom Triple Slider Section
            case 'triple-slider':
              const currentImgIdx = currentImageIdxs[section.id] || 0;
              const topMarqueeItems = section.topTexts ? [...section.topTexts, ...section.topTexts, ...section.topTexts] : [];
              const bottomMarqueeItems = section.bottomTexts ? [...section.bottomTexts, ...section.bottomTexts, ...section.bottomTexts] : [];

              return (
                <section
                  key={section.id}
                  style={{
                    padding: '80px 0',
                    background: 'rgba(17, 16, 22, 0.4)',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 5%', marginBottom: '40px' }}>
                    <h2 style={{ fontSize: '2rem', fontWeight: 900, textAlign: 'center' }}>
                      {renderTitle(section.title)}
                    </h2>
                  </div>

                  {/* 1. Top Text Slider (Left Marquee) */}
                  {topMarqueeItems.length > 0 && (
                    <div className="marquee-container" style={{ marginBottom: '25px' }}>
                      <div className="marquee-content-left">
                        {topMarqueeItems.map((text, idx) => (
                          <div key={idx} className="marquee-item">
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 2. Middle Image Slider (Fading Carousel) */}
                  {section.images && section.images.length > 0 && (
                    <div
                      style={{
                        position: 'relative',
                        width: '100%',
                        maxWidth: '500px',
                        height: '300px',
                        margin: '0 auto 25px auto',
                        borderRadius: 'var(--radius-md)',
                        overflow: 'hidden',
                        border: '1.5px solid var(--glass-border)',
                      }}
                    >
                      {section.images.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          style={{
                            position: 'absolute',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0,
                            opacity: idx === currentImgIdx ? 1 : 0,
                            transition: 'opacity 1s ease-in-out',
                          }}
                        >
                          <img
                            src={imgUrl}
                            alt="Love photos"
                            style={{
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                            }}
                          />
                        </div>
                      ))}

                      {/* Manual Buttons */}
                      <button
                        onClick={() => {
                          const prevIdx = (currentImgIdx - 1 + (section.images?.length || 0)) % (section.images?.length || 1);
                          setCurrentImageIdxs(prev => ({ ...prev, [section.id]: prevIdx }));
                        }}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          right: '15px',
                          transform: 'translateY(-50%)',
                          background: 'rgba(9, 8, 13, 0.6)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '50%',
                          padding: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <ChevronRight size={18} />
                      </button>
                      <button
                        onClick={() => {
                          const nextIdx = (currentImgIdx + 1) % (section.images?.length || 1);
                          setCurrentImageIdxs(prev => ({ ...prev, [section.id]: nextIdx }));
                        }}
                        style={{
                          position: 'absolute',
                          top: '50%',
                          left: '15px',
                          transform: 'translateY(-50%)',
                          background: 'rgba(9, 8, 13, 0.6)',
                          border: 'none',
                          color: '#fff',
                          borderRadius: '50%',
                          padding: '8px',
                          cursor: 'pointer',
                        }}
                      >
                        <ChevronLeft size={18} />
                      </button>

                      {/* Dots indicators */}
                      <div
                        style={{
                          position: 'absolute',
                          bottom: '15px',
                          left: '50%',
                          transform: 'translateX(-50%)',
                          display: 'flex',
                          gap: '6px',
                        }}
                      >
                        {section.images.map((_, idx) => (
                          <div
                            key={idx}
                            style={{
                              width: '8px',
                              height: '8px',
                              borderRadius: '50%',
                              backgroundColor: idx === currentImgIdx ? '#ec4899' : 'rgba(255,255,255,0.4)',
                              transition: 'var(--transition)',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 3. Bottom Text Slider (Right Marquee) */}
                  {bottomMarqueeItems.length > 0 && (
                    <div className="marquee-container">
                      <div className="marquee-content-right">
                        {bottomMarqueeItems.map((text, idx) => (
                          <div key={idx} className="marquee-item">
                            {text}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </section>
              );

            // Testimonials
            case 'testimonials':
              return (
                <section
                  key={section.id}
                  style={{
                    padding: '100px 5%',
                    backgroundColor: 'rgba(11, 15, 25, 0.5)',
                  }}
                >
                  <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
                    <h2
                      style={{
                        textAlign: 'center',
                        fontSize: '2.2rem',
                        fontWeight: 900,
                        marginBottom: '60px',
                      }}
                    >
                      {renderTitle(section.title)}
                    </h2>
                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
                        gap: '30px',
                      }}
                    >
                      {section.items?.map((item: any, idx: number) => (
                        <div
                          key={idx}
                          className="glass-panel"
                          style={{
                            padding: '30px',
                            borderRadius: 'var(--radius-md)',
                            position: 'relative',
                            border: '1.2px solid rgba(255, 255, 255, 0.05)',
                          }}
                        >
                          <div style={{ display: 'flex', gap: '4px', marginBottom: '15px', color: '#fbbf24' }}>
                            {[...Array(item.rating || 5)].map((_, i) => (
                              <Star key={i} size={16} fill="#fbbf24" stroke="none" />
                            ))}
                          </div>
                          <p style={{ fontStyle: 'italic', marginBottom: '20px', color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: 1.7 }}>
                            "{item.text}"
                          </p>
                          <h4 style={{ fontWeight: 'bold', color: '#fff', fontSize: '1rem' }}>{item.name}</h4>
                        </div>
                      ))}
                    </div>
                  </div>
                </section>
              );

            default:
              return null;
          }
        })}
      </main>

      {/* Footer */}
      <footer
        style={{
          padding: '40px 5%',
          backgroundColor: '#050508',
          borderTop: '1px solid var(--glass-border)',
          color: 'var(--text-muted)',
          fontSize: '0.85rem',
        }}
      >
        <div style={{ maxWidth: '800px', marginInline: 'auto', textAlign: 'center' }}>
          <p style={{ marginBottom: '10px' }}>&copy; {new Date().getFullYear()} جميع الحقوق محفوظة لـ ذكرياتنا</p>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '6px' }}>
            <span>صنع بكل حب ليجمع ذكرياتكم الثمينة.</span>
          </div>
        </div>
      </footer>

      {/* Checkout Modal Popup */}
      <CheckoutModal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)} 
        checkoutFields={checkoutFields}
        price={price}
      />
    </div>
  );
}
