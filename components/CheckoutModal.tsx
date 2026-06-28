'use client';

import { useState, useEffect } from 'react';
import { X, CheckCircle2, Loader2 } from 'lucide-react';

interface CheckoutField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
}

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  checkoutFields: CheckoutField[];
  price: number;
}

export default function CheckoutModal({ isOpen, onClose, checkoutFields, price }: CheckoutModalProps) {
  const [formInputs, setFormInputs] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (typeof window !== 'undefined' && (window as any).fbq) {
        (window as any).fbq('track', 'InitiateCheckout');
      }
      setSuccess(false);
      setError('');
      
      // Initialize form fields with empty strings
      const initial: Record<string, string> = {};
      checkoutFields.forEach((field) => {
        initial[field.id] = '';
      });
      setFormInputs(initial);
    }
  }, [isOpen, checkoutFields]);

  if (!isOpen) return null;

  const handleInputChange = (fieldId: string, value: string) => {
    setFormInputs((prev) => ({ ...prev, [fieldId]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate required fields
    for (const field of checkoutFields) {
      if (field.required && !formInputs[field.id]?.trim()) {
        setError(`يرجى ملء الحقل المطلوب: ${field.label}`);
        return;
      }
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputs: formInputs,
          url: window.location.href,
        }),
      });

      const data = await res.json();

      if (data.success) {
        setSuccess(true);
        if (typeof window !== 'undefined' && (window as any).fbq) {
          (window as any).fbq('track', 'Purchase', {
            value: price,
            currency: 'EGP',
          });
        }
      } else {
        setError(data.error || 'حدث خطأ أثناء تسجيل طلبك. يرجى المحاولة مرة أخرى.');
      }
    } catch (err: any) {
      setError('فشل الاتصال بالخادم. يرجى المحاولة لاحقاً.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content glass-panel"
        onClick={(e) => e.stopPropagation()}
        style={{ border: '1px solid rgba(236, 72, 153, 0.2)' }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '20px',
            left: '20px',
            background: 'none',
            border: 'none',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
          }}
        >
          <X size={22} />
        </button>

        {!success ? (
          <form onSubmit={handleSubmit}>
            <h3
              style={{
                fontSize: '1.4rem',
                marginBottom: '10px',
                textAlign: 'center',
                color: '#fff',
                fontWeight: '900',
              }}
            >
              تأكيد طلب الشراء
            </h3>
            <p
              style={{
                color: 'var(--text-secondary)',
                fontSize: '0.9rem',
                textAlign: 'center',
                marginBottom: '20px',
              }}
            >
              يرجى إدخال بياناتك وسنتواصل معك فوراً لتجهيز موقع ذكريات الحب الخاص بكما.
            </p>

            <div
              style={{
                background: 'rgba(236, 72, 153, 0.05)',
                border: '1.2px solid rgba(236, 72, 153, 0.2)',
                padding: '10px',
                borderRadius: 'var(--radius-sm)',
                textAlign: 'center',
                marginBottom: '20px',
                fontWeight: 'bold',
                color: '#fff',
              }}
            >
              إجمالي السعر: <span style={{ color: 'var(--accent-primary)', fontSize: '1.1rem' }}>{price} جنيه مصري</span> (لمرة واحدة فقط)
            </div>

            {error && (
              <div
                style={{
                  background: 'rgba(239, 68, 68, 0.1)',
                  border: '1px solid var(--danger)',
                  padding: '10px',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--danger)',
                  fontSize: '0.85rem',
                  marginBottom: '20px',
                  textAlign: 'center',
                }}
              >
                {error}
              </div>
            )}

            {/* Dynamically render fields from config */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginBottom: '20px' }}>
              {checkoutFields.map((field) => (
                <div key={field.id} className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">
                    {field.label} {field.required && ' *'}
                  </label>
                  
                  {field.type === 'textarea' ? (
                    <textarea
                      className="input-field"
                      placeholder={field.placeholder}
                      value={formInputs[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                      disabled={loading}
                      rows={3}
                    />
                  ) : (
                    <input
                      type={field.type}
                      className="input-field"
                      placeholder={field.placeholder}
                      value={formInputs[field.id] || ''}
                      onChange={(e) => handleInputChange(field.id, e.target.value)}
                      required={field.required}
                      disabled={loading}
                      style={{ 
                        direction: field.type === 'tel' || field.type === 'number' ? 'ltr' : 'rtl',
                        textAlign: 'right' 
                      }}
                    />
                  )}
                </div>
              ))}
            </div>

            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '10px' }} disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="animate-spin" size={18} />
                  جاري تسجيل طلبك...
                </>
              ) : (
                'تأكيد حجز الموقع الآن'
              )}
            </button>
          </form>
        ) : (
          <div style={{ textAlign: 'center', padding: '20px 0' }}>
            <CheckCircle2 size={54} color="var(--success)" style={{ margin: '0 auto 15px auto' }} />
            <h3 style={{ fontSize: '1.4rem', marginBottom: '10px', fontWeight: 'bold' }}>تم استلام طلبك بنجاح!</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '25px', fontSize: '0.92rem' }}>
              شكرًا لطلبك كبسولة الذكريات. سيقوم فريق الدعم الفني بالاتصال بك خلال ساعات قليلة عبر الواتساب للبدء في تسليم لوحة التحكم وموقع الحب الخاص بكما.
            </p>
            <button onClick={onClose} className="btn btn-secondary" style={{ width: '100%' }}>
              إغلاق
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
