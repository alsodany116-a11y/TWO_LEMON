'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ShoppingBag, 
  Settings, 
  Edit3, 
  Plus, 
  Trash2, 
  ArrowUp, 
  ArrowDown, 
  Check, 
  Loader2, 
  LogOut, 
  MessageSquare,
  RefreshCw,
  TrendingUp,
  Image as ImageIcon,
  CheckSquare
} from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface Order {
  id: string;
  inputs: Record<string, string>;
  status: string;
  created_at: string;
  pixel_sent: boolean;
}

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

interface CheckoutField {
  id: string;
  label: string;
  type: string;
  required: boolean;
  placeholder: string;
}

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<'orders' | 'editor' | 'settings'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [sections, setSections] = useState<Section[]>([]);
  const [checkoutFields, setCheckoutFields] = useState<CheckoutField[]>([]);
  const [price, setPrice] = useState<number>(190);
  const [pixelId, setPixelId] = useState('');
  const [capiToken, setCapiToken] = useState('');
  const [testEventCode, setTestEventCode] = useState('');
  
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [savingConfig, setSavingConfig] = useState(false);
  const [savingSettings, setSavingSettings] = useState(false);
  const [uploadingImageId, setUploadingImageId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadCallback, setUploadCallback] = useState<((url: string) => void) | null>(null);

  useEffect(() => {
    fetchOrders();
    fetchConfig();
  }, []);

  const fetchOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch('/api/orders');
      const data = await res.json();
      if (data.success) {
        setOrders(data.orders);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingOrders(false);
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await fetch('/api/config');
      const data = await res.json();
      if (data.success && data.config) {
        setSections(data.config.sections || []);
        setCheckoutFields(data.config.checkout_fields || []);
        setPrice(data.config.price || 190);
        setPixelId(data.config.pixel_id || '');
        setCapiToken(data.config.capi_token || '');
        setTestEventCode(data.config.test_event_code || '');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const showStatus = (type: 'success' | 'error', text: string) => {
    setStatusMsg({ type, text });
    setTimeout(() => setStatusMsg({ type: '', text: '' }), 4000);
  };

  const updateOrderStatus = async (id: string, newStatus: string) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.map((o) => (o.id === id ? { ...o, status: newStatus } : o)));
        showStatus('success', 'تم تحديث حالة الطلب.');
      }
    } catch (err) {
      showStatus('error', 'فشل التحديث.');
    }
  };

  const deleteOrder = async (id: string) => {
    if (!confirm('حذف هذا الطلب؟')) return;
    try {
      const res = await fetch(`/api/orders?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setOrders(orders.filter((o) => o.id !== id));
        showStatus('success', 'تم الحذف.');
      }
    } catch (err) {
      showStatus('error', 'فشل الحذف.');
    }
  };

  const handleSaveConfig = async () => {
    setSavingConfig(true);
    try {
      const res = await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sections,
          checkout_fields: checkoutFields,
          price,
          pixel_id: pixelId,
          capi_token: capiToken,
          test_event_code: testEventCode,
        }),
      });
      const data = await res.json();
      if (data.success) {
        showStatus('success', 'تم حفظ التعديلات بنجاح!');
      } else {
        showStatus('error', data.error || 'فشل حفظ التعديلات.');
      }
    } catch (err) {
      showStatus('error', 'حدث خطأ أثناء الحفظ.');
    } finally {
      setSavingConfig(false);
    }
  };

  // Image upload handler using Supabase Storage
  const triggerImageUpload = (callback: (url: string) => void, uploadId: string) => {
    setUploadCallback(() => callback);
    setUploadingImageId(uploadId);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !uploadCallback) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.floor(Math.random() * 1000)}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload file to Supabase Storage bucket 'landing_images'
      const { error: uploadError } = await supabase.storage
        .from('landing_images')
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      // Get public URL
      const { data } = supabase.storage
        .from('landing_images')
        .getPublicUrl(filePath);

      uploadCallback(data.publicUrl);
      showStatus('success', 'تم تحميل الصورة بنجاح!');
    } catch (error: any) {
      console.error(error);
      alert('خطأ في التحميل. يرجى التأكد من إنشاء bucket عام باسم "landing_images" في Supabase.');
    } finally {
      setUploadingImageId(null);
      setUploadCallback(null);
      if (e.target) e.target.value = '';
    }
  };

  // Section manipulation
  const addSection = (type: string) => {
    const id = `${type}_${Date.now()}`;
    let newSection: Section = { id, type, title: 'عنوان قسم جديد' };
    
    if (type === 'hero') {
      newSection = {
        ...newSection,
        tag: '🎁 هدية رومانسية',
        subtitle: 'عنوان فرعي',
        subtext: 'تفاصيل إضافية',
        buttonText: 'احجز الآن ←',
        priceText: 'سعر العرض: 190 جنيه',
        badges: ['دفع آمن ✅'],
        stats: [{ value: '100+', label: 'عميل سعيد' }],
      };
    } else if (type === 'features') {
      newSection = {
        ...newSection,
        subtitle: 'وصف فرعي',
        items: [{ title: 'ميزة جديدة', description: 'تفاصيل الميزة', icon: 'lock' }],
      };
    } else if (type === 'split-card') {
      newSection = {
        ...newSection,
        tag: 'تسمية فرعية',
        subtitle: 'تفاصيل الموضع بجوار الصورة',
        imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=600&auto=format&fit=crop&q=60',
        position: 'left',
      };
    } else if (type === 'triple-slider') {
      newSection = {
        ...newSection,
        title: 'سلايدر الذكريات الثلاثي',
        topTexts: ['نص 1'],
        images: ['https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=600&auto=format&fit=crop&q=60'],
        bottomTexts: ['نص سفلي 1'],
      };
    } else if (type === 'testimonials') {
      newSection = {
        ...newSection,
        title: 'آراء العملاء',
        items: [{ name: 'اسم العميل', text: 'رأيه بالموقع', rating: 5 }],
      };
    }
    
    setSections([...sections, newSection]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((s) => s.id !== id));
  };

  const moveSection = (index: number, direction: 'up' | 'down') => {
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    if (newIndex < 0 || newIndex >= sections.length) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[newIndex];
    updated[newIndex] = temp;
    setSections(updated);
  };

  const updateSectionText = (id: string, field: keyof Section, val: any) => {
    setSections(sections.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  };

  const updateSectionItem = (secId: string, itemIdx: number, field: string, val: any) => {
    setSections(
      sections.map((s) => {
        if (s.id !== secId || !s.items) return s;
        const newItems = [...s.items];
        newItems[itemIdx] = { ...newItems[itemIdx], [field]: val };
        return { ...s, items: newItems };
      })
    );
  };

  const addSectionItem = (secId: string, defaultObj: any) => {
    setSections(
      sections.map((s) => {
        if (s.id !== secId) return s;
        return { ...s, items: [...(s.items || []), defaultObj] };
      })
    );
  };

  const removeSectionItem = (secId: string, itemIdx: number) => {
    setSections(
      sections.map((s) => {
        if (s.id !== secId || !s.items) return s;
        return { ...s, items: s.items.filter((_, i) => i !== itemIdx) };
      })
    );
  };

  // Helper to resolve dynamic WhatsApp contact links from the order JSONB input
  const getWhatsAppLink = (inputs: Record<string, string>) => {
    let phone = '';
    let name = '';
    
    Object.keys(inputs).forEach(key => {
      const lower = key.toLowerCase();
      if (lower.includes('phone') || lower.includes('هاتف') || lower.includes('رقم') || lower.includes('موبايل') || lower.includes('واتساب') || lower.includes('whatsapp')) {
        phone = inputs[key];
      }
      if (lower.includes('name') || lower.includes('الاسم') || lower.includes('اسم')) {
        name = inputs[key];
      }
    });

    const text = encodeURIComponent(`مرحباً يا ${name || 'عميلنا العزيز'}،\nلقد استلمنا طلبك لحجز موقع ذكريات الحب ونود التواصل معك لتأكيد تفاصيل الصور وملف الأغاني الخاص بكما.`);
    const cleanPhone = phone.replace(/\D/g, '');
    const phoneWithCode = cleanPhone.startsWith('0') && cleanPhone.length === 11 ? `20${cleanPhone.slice(1)}` : cleanPhone;
    return `https://wa.me/${phoneWithCode}?text=${text}`;
  };

  return (
    <div className="dashboard-container">
      {/* Hidden file selector */}
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        style={{ display: 'none' }} 
        accept="image/*" 
      />

      {/* Sidebar Navigation */}
      <aside
        className="glass-panel"
        style={{
          borderLeft: '1px solid var(--glass-border)',
          display: 'flex',
          flexDirection: 'column',
          padding: '30px 20px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px' }}>
          <div style={{ background: 'var(--accent-gradient)', padding: '10px', borderRadius: 'var(--radius-sm)' }}>
            <ShoppingBag size={24} />
          </div>
          <span style={{ fontWeight: 900, fontSize: '1.4rem' }}>لوحة التحكم</span>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1 }}>
          <button
            onClick={() => setActiveTab('orders')}
            className={`btn ${activeTab === 'orders' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%', borderRadius: '12px' }}
          >
            <TrendingUp size={18} />
            إدارة الطلبات ({orders.length})
          </button>

          <button
            onClick={() => setActiveTab('editor')}
            className={`btn ${activeTab === 'editor' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%', borderRadius: '12px' }}
          >
            <Edit3 size={18} />
            تعديل صفحة الهبوط
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`btn ${activeTab === 'settings' ? 'btn-primary' : 'btn-secondary'}`}
            style={{ justifyContent: 'flex-start', width: '100%', borderRadius: '12px' }}
          >
            <Settings size={18} />
            صفحة الطلب وتتبع بيكسل
          </button>
        </nav>

        <a href="/" className="btn btn-secondary" style={{ marginTop: '20px', gap: '10px', borderRadius: '12px' }}>
          <LogOut size={16} />
          معاينة الموقع
        </a>
      </aside>

      {/* Content panel */}
      <main style={{ padding: '40px 5%', overflowY: 'auto', maxHeight: '100vh' }}>
        {statusMsg.text && (
          <div
            className="glass-panel"
            style={{
              position: 'fixed',
              bottom: '30px',
              left: '30px',
              padding: '16px 24px',
              borderRadius: 'var(--radius-md)',
              border: `1px solid ${statusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)'}`,
              background: 'rgba(15, 23, 42, 0.95)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            <Check size={18} color={statusMsg.type === 'success' ? 'var(--success)' : 'var(--danger)'} />
            <span>{statusMsg.text}</span>
          </div>
        )}

        {/* Tab 1: Orders */}
        {activeTab === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '35px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>الطلبات المستلمة</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>إدارة ومتابعة طلبات حجز كبسولة ذكريات الحب</p>
              </div>
              <button onClick={fetchOrders} className="btn btn-secondary" style={{ padding: '10px', borderRadius: '50%' }} title="تحديث">
                <RefreshCw size={18} className={loadingOrders ? 'animate-spin' : ''} />
              </button>
            </div>

            {/* Metrics */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '20px', marginBottom: '40px' }}>
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>إجمالي الطلبات</span>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px' }}>{orders.length}</h2>
              </div>
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>المعلقة</span>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--warning)' }}>
                  {orders.filter((o) => o.status === 'pending').length}
                </h2>
              </div>
              <div className="glass-panel" style={{ padding: '24px', borderRadius: 'var(--radius-md)' }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>المؤكدة</span>
                <h2 style={{ fontSize: '2.2rem', fontWeight: 800, marginTop: '8px', color: 'var(--success)' }}>
                  {orders.filter((o) => o.status === 'approved').length}
                </h2>
              </div>
            </div>

            {/* Table */}
            <div className="glass-panel" style={{ borderRadius: 'var(--radius-md)', overflowX: 'auto' }}>
              {loadingOrders ? (
                <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  <Loader2 className="animate-spin" size={32} style={{ margin: '0 auto 15px auto' }} />
                  جاري تحميل الطلبات...
                </div>
              ) : orders.length === 0 ? (
                <div style={{ padding: '50px', textAlign: 'center', color: 'var(--text-secondary)' }}>
                  لا توجد أي طلبات مستلمة حتى الآن.
                </div>
              ) : (
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>تاريخ الطلب</th>
                      <th>بيانات العميل (مدخلات الحقول الديناميكية)</th>
                      <th>حالة إرسال CAPI</th>
                      <th>حالة الطلب</th>
                      <th>إجراءات</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(order.created_at).toLocaleString('ar-EG')}
                        </td>
                        <td style={{ fontSize: '0.9rem' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                            {Object.entries(order.inputs).map(([key, val]) => {
                              // Find label corresponding to this key ID
                              const field = checkoutFields.find(f => f.id === key);
                              return (
                                <div key={key}>
                                  <span style={{ color: 'var(--text-secondary)', fontWeight: 'bold' }}>{field?.label || key}:</span> {val}
                                </div>
                              );
                            })}
                          </div>
                        </td>
                        <td>
                          {order.pixel_sent ? (
                            <span className="status-badge" style={{ background: 'rgba(236, 72, 153, 0.1)', color: '#ec4899' }}>
                              مُرسل للفيسبوك
                            </span>
                          ) : (
                            <span className="status-badge" style={{ background: 'rgba(255,255,255,0.03)', color: 'var(--text-muted)' }}>
                              لم يُرسل
                            </span>
                          )}
                        </td>
                        <td>
                          <select
                            value={order.status}
                            onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                            className="input-field"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', width: '130px', borderRadius: '8px' }}
                          >
                            <option value="pending">⏳ معلق</option>
                            <option value="approved">✅ مؤكد</option>
                            <option value="cancelled">❌ ملغي</option>
                          </select>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <a
                              href={getWhatsAppLink(order.inputs)}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', color: '#25D366', borderRadius: '8px' }}
                              title="تواصل واتساب"
                            >
                              <MessageSquare size={16} />
                            </a>
                            <button
                              onClick={() => deleteOrder(order.id)}
                              className="btn btn-secondary"
                              style={{ padding: '6px 10px', color: 'var(--danger)', borderRadius: '8px' }}
                              title="حذف"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Editor */}
        {activeTab === 'editor' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
              <div>
                <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>محرر صفحة الهبوط</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>تحكم في كل كلمة ونسق الأقسام والمحتوى</p>
              </div>
              <button onClick={handleSaveConfig} className="btn btn-primary" disabled={savingConfig}>
                {savingConfig ? <Loader2 className="animate-spin" size={18} /> : 'حفظ جميع التعديلات'}
              </button>
            </div>

            <div style={{ padding: '12px 20px', background: 'rgba(236, 72, 153, 0.05)', borderRadius: 'var(--radius-md)', marginBottom: '30px', border: '1.2px solid rgba(236, 72, 153, 0.2)' }}>
              <span style={{ fontSize: '0.9rem', color: 'var(--accent-primary)', fontWeight: 'bold' }}>💡 نصيحة للتصميم والتحميل:</span>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                1. لتلوين كلمة معينة بوهج وردي متدرج، ضعها بداخل أقواس مجعدة مثل: <code>حفظ {'{قصة حبكم}'} للابد</code>.
                <br />
                2. لرفع صورة من جهازك بدلاً من الروابط، اضغط على زر <strong>"تحميل صورة" 📷</strong> بجانب أي حقل رابط صورة (تأكد من تهيئة Storage Bucket باسم <code>landing_images</code> في سوبابيز).
              </p>
            </div>

            {/* Dynamic sections */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              {sections.map((section, index) => (
                <div key={section.id} className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-lg)' }}>
                  
                  {/* Section Controls */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '15px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                        {section.type.toUpperCase()}
                      </span>
                      <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>{section.title || 'قسم بدون عنوان'}</h3>
                    </div>

                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button onClick={() => moveSection(index, 'up')} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }} disabled={index === 0}>
                        <ArrowUp size={16} />
                      </button>
                      <button onClick={() => moveSection(index, 'down')} className="btn btn-secondary" style={{ padding: '6px 10px', borderRadius: '8px' }} disabled={index === sections.length - 1}>
                        <ArrowDown size={16} />
                      </button>
                      <button onClick={() => removeSection(section.id)} className="btn btn-secondary" style={{ padding: '6px 10px', color: 'var(--danger)', borderRadius: '8px' }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* 1. Hero Editor */}
                  {section.type === 'hero' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">شارة الترويج بالأعلى (Tag)</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.tag || ''}
                          onChange={(e) => updateSectionText(section.id, 'tag', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">العنوان الرئيسي</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.title || ''}
                          onChange={(e) => updateSectionText(section.id, 'title', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">العنوان الفرعي</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.subtitle || ''}
                          onChange={(e) => updateSectionText(section.id, 'subtitle', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">الوصف الإضافي (subtext)</label>
                        <textarea
                          className="input-field"
                          rows={2}
                          value={section.subtext || ''}
                          onChange={(e) => updateSectionText(section.id, 'subtext', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">نص زر الطلب</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.buttonText || ''}
                          onChange={(e) => updateSectionText(section.id, 'buttonText', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">نص السعر الموضح</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.priceText || ''}
                          onChange={(e) => updateSectionText(section.id, 'priceText', e.target.value)}
                        />
                      </div>

                      {/* Stats counter values */}
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">أرقام وإحصائيات الهيرو (Stats):</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '10px' }}>
                          {section.stats?.map((stat, sIdx) => (
                            <div key={sIdx} style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="input-field"
                                placeholder="القيمة (مثال: 12,400+)"
                                value={stat.value || ''}
                                onChange={(e) => {
                                  const updated = [...(section.stats || [])];
                                  updated[sIdx] = { ...updated[sIdx], value: e.target.value };
                                  updateSectionText(section.id, 'stats', updated);
                                }}
                              />
                              <input
                                type="text"
                                className="input-field"
                                placeholder="العنوان (مثال: ذكرى تم توثيقها)"
                                value={stat.label || ''}
                                onChange={(e) => {
                                  const updated = [...(section.stats || [])];
                                  updated[sIdx] = { ...updated[sIdx], label: e.target.value };
                                  updateSectionText(section.id, 'stats', updated);
                                }}
                              />
                              <button
                                onClick={() => {
                                  const updated = section.stats?.filter((_, si) => si !== sIdx) || [];
                                  updateSectionText(section.id, 'stats', updated);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '12px', color: 'var(--danger)', borderRadius: '8px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const updated = [...(section.stats || []), { value: '100+', label: 'احصائية' }];
                              updateSectionText(section.id, 'stats', updated);
                            }}
                            className="btn btn-secondary"
                            style={{ alignSelf: 'flex-start', fontSize: '0.85rem', borderRadius: '8px' }}
                          >
                            <Plus size={14} /> إضافة إحصائية
                          </button>
                        </div>
                      </div>

                      {/* Checklist badges */}
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">مزايا وشارات الهيرو (Badges):</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', marginTop: '10px' }}>
                          {section.badges?.map((badge, bIdx) => (
                            <div key={bIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="input-field"
                                style={{ padding: '6px 12px', width: '160px', fontSize: '0.85rem' }}
                                value={badge}
                                onChange={(e) => {
                                  const updatedBadges = [...(section.badges || [])];
                                  updatedBadges[bIdx] = e.target.value;
                                  updateSectionText(section.id, 'badges', updatedBadges);
                                }}
                              />
                              <button
                                onClick={() => {
                                  const updatedBadges = section.badges?.filter((_, bi) => bi !== bIdx) || [];
                                  updateSectionText(section.id, 'badges', updatedBadges);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '8px', color: 'var(--danger)', borderRadius: '8px' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const updatedBadges = [...(section.badges || []), 'ميزة جديدة ✅'];
                              updateSectionText(section.id, 'badges', updatedBadges);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
                          >
                            <Plus size={14} /> إضافة ميزة
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 2. Features Editor */}
                  {section.type === 'features' && (
                    <div>
                      <div className="form-group">
                        <label className="form-label">عنوان القسم</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.title || ''}
                          onChange={(e) => updateSectionText(section.id, 'title', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">العنوان الفرعي</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.subtitle || ''}
                          onChange={(e) => updateSectionText(section.id, 'subtitle', e.target.value)}
                        />
                      </div>
                      
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>المميزات المعروضة:</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {section.items?.map((item: any, idx: number) => (
                          <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '15px' }}>
                              <input
                                type="text"
                                className="input-field"
                                placeholder="العنوان"
                                value={item.title || ''}
                                onChange={(e) => updateSectionItem(section.id, idx, 'title', e.target.value)}
                              />
                              <input
                                type="text"
                                className="input-field"
                                placeholder="الوصف"
                                value={item.description || ''}
                                onChange={(e) => updateSectionItem(section.id, idx, 'description', e.target.value)}
                              />
                              <select
                                className="input-field"
                                value={item.icon || 'lock'}
                                onChange={(e) => updateSectionItem(section.id, idx, 'icon', e.target.value)}
                              >
                                <option value="lock">🔒 قفل أمان</option>
                                <option value="heart">💖 قلب حب</option>
                                <option value="gift">🎁 علبة هدية</option>
                                <option value="cloud">☁️ سحابة/سيرفر</option>
                              </select>
                            </div>
                            <button onClick={() => removeSectionItem(section.id, idx)} className="btn btn-secondary" style={{ color: 'var(--danger)', padding: '10px', borderRadius: '8px' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addSectionItem(section.id, { title: 'ميزة جديدة', description: 'التفاصيل', icon: 'lock' })}
                          className="btn btn-secondary"
                          style={{ alignSelf: 'flex-start', borderRadius: '8px' }}
                        >
                          <Plus size={16} /> إضافة ميزة
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 3. Rich Text (Story) Editor */}
                  {section.type === 'rich-text' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                      <div className="form-group">
                        <label className="form-label">شارة القسم بالأعلى (Tag)</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.tag || ''}
                          onChange={(e) => updateSectionText(section.id, 'tag', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">عنوان القسم</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.title || ''}
                          onChange={(e) => updateSectionText(section.id, 'title', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">المحتوى النصي</label>
                        <textarea
                          className="input-field"
                          rows={5}
                          value={section.content || ''}
                          onChange={(e) => updateSectionText(section.id, 'content', e.target.value)}
                        />
                      </div>
                    </div>
                  )}

                  {/* 4. Split Card Editor (with Upload button) */}
                  {section.type === 'split-card' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                      <div className="form-group">
                        <label className="form-label">شارة القسم بالأعلى (Tag)</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.tag || ''}
                          onChange={(e) => updateSectionText(section.id, 'tag', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">العنوان الرئيسي</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.title || ''}
                          onChange={(e) => updateSectionText(section.id, 'title', e.target.value)}
                        />
                      </div>
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">المحتوى النصي</label>
                        <textarea
                          className="input-field"
                          rows={3}
                          value={section.subtitle || ''}
                          onChange={(e) => updateSectionText(section.id, 'subtitle', e.target.value)}
                        />
                      </div>
                      <div className="form-group">
                        <label className="form-label">رابط الصورة (أو ارفع من جهازك)</label>
                        <div style={{ display: 'flex', gap: '10px' }}>
                          <input
                            type="text"
                            className="input-field"
                            value={section.imageUrl || ''}
                            onChange={(e) => updateSectionText(section.id, 'imageUrl', e.target.value)}
                          />
                          <button
                            type="button"
                            onClick={() => triggerImageUpload((url) => updateSectionText(section.id, 'imageUrl', url), `${section.id}_image`)}
                            className="btn btn-secondary"
                            style={{ padding: '12px', whiteSpace: 'nowrap', borderRadius: '12px' }}
                            disabled={uploadingImageId === `${section.id}_image`}
                          >
                            {uploadingImageId === `${section.id}_image` ? (
                              <Loader2 className="animate-spin" size={16} />
                            ) : (
                              <>
                                <ImageIcon size={16} />
                                تحميل صورة
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                      <div className="form-group">
                        <label className="form-label">موضع الصورة بالنسبة للكلام</label>
                        <select
                          className="input-field"
                          value={section.position || 'left'}
                          onChange={(e) => updateSectionText(section.id, 'position', e.target.value)}
                        >
                          <option value="left">الصورة على اليمين والكلام على اليسار</option>
                          <option value="right">الكلام على اليمين والصورة على اليسار</option>
                        </select>
                      </div>
                    </div>
                  )}

                  {/* 5. Triple Slider Editor */}
                  {section.type === 'triple-slider' && (
                    <div>
                      <div className="form-group">
                        <label className="form-label">عنوان القسم</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.title || ''}
                          onChange={(e) => updateSectionText(section.id, 'title', e.target.value)}
                        />
                      </div>

                      {/* Top Marquee Texts */}
                      <div className="form-group">
                        <label className="form-label">1. نصوص الشريط العلوي (Top Slider):</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                          {section.topTexts?.map((text, tIdx) => (
                            <div key={tIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="input-field"
                                style={{ padding: '6px 12px', width: '150px', fontSize: '0.85rem' }}
                                value={text}
                                onChange={(e) => {
                                  const updatedTexts = [...(section.topTexts || [])];
                                  updatedTexts[tIdx] = e.target.value;
                                  updateSectionText(section.id, 'topTexts', updatedTexts);
                                }}
                              />
                              <button
                                onClick={() => {
                                  const updatedTexts = section.topTexts?.filter((_, ti) => ti !== tIdx) || [];
                                  updateSectionText(section.id, 'topTexts', updatedTexts);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '8px', color: 'var(--danger)', borderRadius: '8px' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const updated = [...(section.topTexts || []), 'كلمات جديدة'];
                              updateSectionText(section.id, 'topTexts', updated);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
                          >
                            <Plus size={14} /> إضافة نص
                          </button>
                        </div>
                      </div>

                      {/* Middle Images (with Upload buttons) */}
                      <div className="form-group" style={{ marginTop: '20px' }}>
                        <label className="form-label">2. صور السلايدر الأوسط (Middle Images):</label>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginTop: '8px' }}>
                          {section.images?.map((imgUrl, imgIdx) => (
                            <div key={imgIdx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="input-field"
                                placeholder="رابط صورة الحبيبين (URL)"
                                value={imgUrl}
                                onChange={(e) => {
                                  const updatedImgs = [...(section.images || [])];
                                  updatedImgs[imgIdx] = e.target.value;
                                  updateSectionText(section.id, 'images', updatedImgs);
                                }}
                              />
                              <button
                                type="button"
                                onClick={() => triggerImageUpload((url) => {
                                  const updatedImgs = [...(section.images || [])];
                                  updatedImgs[imgIdx] = url;
                                  updateSectionText(section.id, 'images', updatedImgs);
                                }, `${section.id}_img_${imgIdx}`)}
                                className="btn btn-secondary"
                                style={{ padding: '12px', whiteSpace: 'nowrap', borderRadius: '12px' }}
                                disabled={uploadingImageId === `${section.id}_img_${imgIdx}`}
                              >
                                {uploadingImageId === `${section.id}_img_${imgIdx}` ? (
                                  <Loader2 className="animate-spin" size={16} />
                                ) : (
                                  <>
                                    <ImageIcon size={16} />
                                    تحميل صورة
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => {
                                  const updatedImgs = section.images?.filter((_, ii) => ii !== imgIdx) || [];
                                  updateSectionText(section.id, 'images', updatedImgs);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '12px', color: 'var(--danger)', borderRadius: '12px' }}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const updated = [...(section.images || []), 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800&auto=format&fit=crop&q=80'];
                              updateSectionText(section.id, 'images', updated);
                            }}
                            className="btn btn-secondary"
                            style={{ alignSelf: 'flex-start', fontSize: '0.85rem', borderRadius: '8px' }}
                          >
                            <Plus size={14} /> إضافة صورة
                          </button>
                        </div>
                      </div>

                      {/* Bottom Marquee Texts */}
                      <div className="form-group" style={{ marginTop: '20px' }}>
                        <label className="form-label">3. نصوص الشريط السفلي (Bottom Slider):</label>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '8px' }}>
                          {section.bottomTexts?.map((text, bIdx) => (
                            <div key={bIdx} style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                              <input
                                type="text"
                                className="input-field"
                                style={{ padding: '6px 12px', width: '150px', fontSize: '0.85rem' }}
                                value={text}
                                onChange={(e) => {
                                  const updatedTexts = [...(section.bottomTexts || [])];
                                  updatedTexts[bIdx] = e.target.value;
                                  updateSectionText(section.id, 'bottomTexts', updatedTexts);
                                }}
                              />
                              <button
                                onClick={() => {
                                  const updatedTexts = section.bottomTexts?.filter((_, bi) => bi !== bIdx) || [];
                                  updateSectionText(section.id, 'bottomTexts', updatedTexts);
                                }}
                                className="btn btn-secondary"
                                style={{ padding: '8px', color: 'var(--danger)', borderRadius: '8px' }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          ))}
                          <button
                            onClick={() => {
                              const updated = [...(section.bottomTexts || []), 'كلمات جديدة'];
                              updateSectionText(section.id, 'bottomTexts', updated);
                            }}
                            className="btn btn-secondary"
                            style={{ padding: '6px 12px', fontSize: '0.85rem', borderRadius: '8px' }}
                          >
                            <Plus size={14} /> إضافة نص
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* 6. Testimonials Editor */}
                  {section.type === 'testimonials' && (
                    <div>
                      <div className="form-group">
                        <label className="form-label">عنوان القسم</label>
                        <input
                          type="text"
                          className="input-field"
                          value={section.title || ''}
                          onChange={(e) => updateSectionText(section.id, 'title', e.target.value)}
                        />
                      </div>
                      
                      <h4 style={{ fontSize: '0.95rem', color: 'var(--text-secondary)', marginBottom: '15px' }}>المراجعات (الرأي يظهر في صندوق مربع):</h4>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {section.items?.map((item: any, idx: number) => (
                          <div key={idx} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center' }}>
                            <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.2fr 2fr 1fr', gap: '15px' }}>
                              <input
                                type="text"
                                className="input-field"
                                placeholder="اسم العميل"
                                value={item.name || ''}
                                onChange={(e) => updateSectionItem(section.id, idx, 'name', e.target.value)}
                              />
                              <textarea
                                className="input-field"
                                placeholder="الرأي أو المراجعة"
                                value={item.text || ''}
                                rows={2}
                                onChange={(e) => updateSectionItem(section.id, idx, 'text', e.target.value)}
                              />
                              <select
                                className="input-field"
                                value={item.rating || 5}
                                onChange={(e) => updateSectionItem(section.id, idx, 'rating', parseInt(e.target.value))}
                              >
                                <option value="5">⭐⭐⭐⭐⭐</option>
                                <option value="4">⭐⭐⭐⭐</option>
                                <option value="3">⭐⭐⭐</option>
                              </select>
                            </div>
                            <button onClick={() => removeSectionItem(section.id, idx)} className="btn btn-secondary" style={{ color: 'var(--danger)', padding: '10px', borderRadius: '8px' }}>
                              <Trash2 size={16} />
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={() => addSectionItem(section.id, { name: 'اسم العميل', text: 'رأي العميل', rating: 5 })}
                          className="btn btn-secondary"
                          style={{ alignSelf: 'flex-start', borderRadius: '8px' }}
                        >
                          <Plus size={16} /> إضافة رأي
                        </button>
                      </div>
                    </div>
                  )}

                </div>
              ))}

              {/* Add section triggers */}
              <div className="glass-panel" style={{ padding: '30px', borderRadius: 'var(--radius-lg)', textAlign: 'center' }}>
                <h3 style={{ fontSize: '1.2rem', marginBottom: '20px', fontWeight: 'bold' }}>أضف قسماً جديداً لصفحة الهبوط</h3>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', justifyContent: 'center' }}>
                  <button onClick={() => addSection('hero')} className="btn btn-secondary" style={{ borderRadius: '12px' }}>
                    <Plus size={16} /> واجهة رئيسية (Hero)
                  </button>
                  <button onClick={() => addSection('rich-text')} className="btn btn-secondary" style={{ borderRadius: '12px' }}>
                    <Plus size={16} /> قصة الحب (Rich Text)
                  </button>
                  <button onClick={() => addSection('features')} className="btn btn-secondary" style={{ borderRadius: '12px' }}>
                    <Plus size={16} /> مميزات الكبسولة (Features)
                  </button>
                  <button onClick={() => addSection('triple-slider')} className="btn btn-secondary" style={{ borderRadius: '12px' }}>
                    <Plus size={16} /> سلايدر الذكريات الثلاثي (Triple Slider)
                  </button>
                  <button onClick={() => addSection('split-card')} className="btn btn-secondary" style={{ borderRadius: '12px' }}>
                    <Plus size={16} /> صورة ومحتوى (Split Card)
                  </button>
                  <button onClick={() => addSection('testimonials')} className="btn btn-secondary" style={{ borderRadius: '12px' }}>
                    <Plus size={16} /> آراء العملاء (Testimonials)
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: settings */}
        {activeTab === 'settings' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
            
            {/* Price & Checkout Fields Configuration */}
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>إعدادات صفحة الطلب (Checkout)</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '25px' }}>
                تحكم في سعر حجز الكبسولة وحدد الحقول التي يملؤها العميل عند الشراء
              </p>

              <div className="glass-panel" style={{ padding: '35px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                {/* Price Editor */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">سعر المنتج بالجنيه المصري (EGP) *</label>
                  <input
                    type="number"
                    className="input-field"
                    value={price}
                    onChange={(e) => setPrice(Math.max(0, parseInt(e.target.value) || 0))}
                    required
                    style={{ maxWidth: '200px' }}
                  />
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                    سيتم عرض هذا السعر تلقائياً في خانات نافذة الطلب وتعديلها بالكامل.
                  </span>
                </div>

                {/* Form fields builder */}
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ marginBottom: '15px' }}>حقول نموذج الطلب (Input Fields):</label>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    {checkoutFields.map((field, fIdx) => (
                      <div key={field.id} className="glass-panel" style={{ padding: '20px', display: 'flex', gap: '15px', alignItems: 'center', background: 'rgba(255,255,255,0.01)' }}>
                        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.5fr 2fr 1fr 1fr', gap: '15px' }}>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>اسم الحقل</span>
                            <input
                              type="text"
                              className="input-field"
                              value={field.label}
                              onChange={(e) => {
                                const updated = [...checkoutFields];
                                updated[fIdx] = { ...updated[fIdx], label: e.target.value };
                                setCheckoutFields(updated);
                              }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>النص التلميحي (Placeholder)</span>
                            <input
                              type="text"
                              className="input-field"
                              value={field.placeholder}
                              onChange={(e) => {
                                const updated = [...checkoutFields];
                                updated[fIdx] = { ...updated[fIdx], placeholder: e.target.value };
                                setCheckoutFields(updated);
                              }}
                            />
                          </div>
                          <div>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '4px', display: 'block' }}>نوع المدخل</span>
                            <select
                              className="input-field"
                              value={field.type}
                              onChange={(e) => {
                                const updated = [...checkoutFields];
                                updated[fIdx] = { ...updated[fIdx], type: e.target.value };
                                setCheckoutFields(updated);
                              }}
                            >
                              <option value="text">نص (Text)</option>
                              <option value="tel">هاتف (Tel)</option>
                              <option value="number">أرقام (Number)</option>
                              <option value="textarea">مربع نصي كبير (Textarea)</option>
                            </select>
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>مطلوب؟</span>
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => {
                                const updated = [...checkoutFields];
                                updated[fIdx] = { ...updated[fIdx], required: e.target.checked };
                                setCheckoutFields(updated);
                              }}
                              style={{ width: '20px', height: '20px', accentColor: '#ec4899', cursor: 'pointer' }}
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCheckoutFields(checkoutFields.filter((_, fi) => fi !== fIdx));
                          }}
                          className="btn btn-secondary"
                          style={{ padding: '12px', color: 'var(--danger)', borderRadius: '12px', marginTop: '22px' }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    
                    <button
                      type="button"
                      onClick={() => {
                        const newId = `field_${Date.now()}`;
                        setCheckoutFields([...checkoutFields, {
                          id: newId,
                          label: 'حقل جديد',
                          type: 'text',
                          required: false,
                          placeholder: 'أدخل البيانات هنا'
                        }]);
                      }}
                      className="btn btn-secondary"
                      style={{ alignSelf: 'flex-start', borderRadius: '8px' }}
                    >
                      <Plus size={16} /> إضافة حقل جديد للطلب
                    </button>
                  </div>
                </div>

                <button onClick={handleSaveConfig} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }} disabled={savingConfig}>
                  {savingConfig ? <Loader2 className="animate-spin" size={18} /> : 'حفظ إعدادات صفحة الطلب والأسعار'}
                </button>
              </div>
            </div>

            {/* Meta Integration settings */}
            <div>
              <h2 style={{ fontSize: '1.6rem', fontWeight: 800, marginBottom: '10px' }}>إعدادات التتبع والربط (Facebook Pixel & CAPI)</h2>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginBottom: '25px' }}>
                تتبع الزوار والتحويلات بيكسل و CAPI على خادم فيسبوك تلقائياً
              </p>

              <div className="glass-panel" style={{ padding: '35px', borderRadius: 'var(--radius-lg)', display: 'flex', flexDirection: 'column', gap: '25px' }}>
                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Facebook Pixel ID</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="مثال: 1234567890"
                    value={pixelId}
                    onChange={(e) => setPixelId(e.target.value)}
                    style={{ fontFamily: 'var(--font-english)', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Facebook Conversion API Token</label>
                  <textarea
                    className="input-field"
                    rows={3}
                    placeholder="تبدأ بـ EAAG..."
                    value={capiToken}
                    onChange={(e) => setCapiToken(e.target.value)}
                    style={{ fontFamily: 'var(--font-english)', direction: 'ltr', textAlign: 'right', resize: 'vertical' }}
                  />
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Facebook Test Event Code (للأحداث التجريبية)</label>
                  <input
                    type="text"
                    className="input-field"
                    placeholder="TEST12345"
                    value={testEventCode}
                    onChange={(e) => setTestEventCode(e.target.value)}
                    style={{ fontFamily: 'var(--font-english)', direction: 'ltr', textAlign: 'right' }}
                  />
                </div>

                <button onClick={handleSaveSettings} className="btn btn-primary" style={{ alignSelf: 'flex-start', marginTop: '10px' }} disabled={savingSettings}>
                  {savingSettings ? <Loader2 className="animate-spin" size={18} /> : 'حفظ إعدادات التتبع'}
                </button>
              </div>
            </div>

          </div>
        )}
      </main>
    </div>
  );
}
