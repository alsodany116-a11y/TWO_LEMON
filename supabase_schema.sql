-- Drop old tables to avoid conflicts
DROP TABLE IF EXISTS page_config CASCADE;
DROP TABLE IF EXISTS orders CASCADE;

-- Create the new page_config table with all columns
CREATE TABLE page_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    key TEXT UNIQUE NOT NULL,
    site_name TEXT DEFAULT 'رسائل الحب',
    price INTEGER NOT NULL DEFAULT 190,
    promo_text TEXT DEFAULT '⏰ عرض محدود — أول 50 طلب بسعر 190 جنيه بس',
    promo_toggle BOOLEAN DEFAULT true,
    support_whatsapp TEXT DEFAULT '201012345678',
    sections JSONB NOT NULL,
    checkout_fields JSONB NOT NULL,
    testimonials JSONB NOT NULL DEFAULT '[]'::jsonb,
    faqs JSONB NOT NULL DEFAULT '[]'::jsonb,
    pixel_id TEXT,
    capi_token TEXT,
    test_event_code TEXT,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Seed page_config with the complete default setup (including screenshots section)
INSERT INTO page_config (
    key, 
    site_name, 
    price, 
    promo_text, 
    promo_toggle, 
    support_whatsapp, 
    sections, 
    checkout_fields, 
    testimonials, 
    faqs
) VALUES (
    'default',
    'رسائل الحب',
    190,
    '⏰ عرض محدود — أول 50 طلب بسعر 190 جنيه بس',
    true,
    '201012345678',
    '[
        {
            "id": "hero",
            "type": "hero",
            "tag": "🎁 هدية رومانسية غير متوقعة لشريك حياتك",
            "title": "احفظ {قصة حبكم} في موقع خاص محمي بكلمة سر",
            "subtitle": "كبسولة زمنية رقمية تجمع ذكرياتكم، رسائلكم، صوركم، وأغانيكم المفضلة في مكان آمن للأبد."
        },
        {
            "id": "images_sec_1",
            "type": "images-section",
            "title": "الصور اللي بتحكي {أجمل لحظاتكم}",
            "subtitle": "معرض ذكريات صور الحبيبين",
            "desc": "ألبوم صور تفاعلي يجمع أجمل لحظاتكم بجودة كاملة وسهولة فائقة في الاستعراض لترتيب وتوثيق ذكريات حبكم.",
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=800",
                    "title": "لقائنا الأول",
                    "desc": "اليوم اللي غير حياتي للأبد وبداية قصتنا"
                }
            ]
        },
        {
            "id": "screenshots_sec_2",
            "type": "screenshots",
            "title": "اسكرينات من {محادثات الموبايل} بينا",
            "subtitle": "لقطات شاشة (Screenshots)",
            "desc": "الرسائل دي هي اللي بتفكرنا بكل لحظة ضحكنا فيها سوا أو كلام طيب دفي قلوبنا وسط زحام الأيام.",
            "images": [
                {
                    "url": "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800",
                    "title": "رسالة الصباح",
                    "desc": "كل كلمة حب كتبتها ليا كانت بتفرق معايا جداً"
                }
            ],
            "bottomDesc": "كل كلمة حب كتبتها ليا، وكل صورة بعتها في وقت الشغل.. دي الكبسولة اللي بتجمعنا وبتخليلنا دايماً مكان دافي نرجعله."
        }
    ]'::jsonb,
    '[
        {"id": "name", "label": "الاسم بالكامل", "type": "text", "required": true, "placeholder": "أدخل اسمك الثلاثي"},
        {"id": "phone", "label": "رقم الهاتف للاتصال", "type": "tel", "required": true, "placeholder": "مثال: 01012345678"}
    ]'::jsonb,
    '[
        {
            "name": "محمد ونهى",
            "text": "عملت الموقع ده لخطيبتي في عيد ميلادها وانبهرت بيه جداً، فكرة مبتكرة وأحسن بكتير من الهدايا التقليدية.",
            "rating": 5,
            "source": "عميل حجز هديته"
        }
    ]'::jsonb,
    '[
        {
            "q": "إزاي شريكي هيفتح الموقع؟",
            "a": "بنرسلك رابط خاص بيكما وباسورد بتختاروه سوا، شريكك يفتحه في أي وقت ومن أي موبايل بمجرد إدخال الباسورد."
        }
    ]'::jsonb
);

-- Create the orders table
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inputs JSONB NOT NULL,
    status TEXT NOT NULL DEFAULT 'جديد',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    pixel_sent BOOLEAN DEFAULT false,
    capi_response TEXT
);

-- Enable Row Level Security (RLS)
ALTER TABLE page_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Setup simple public access policies
CREATE POLICY "Allow public read to page_config" ON page_config FOR SELECT USING (true);
CREATE POLICY "Allow public write to page_config" ON page_config FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow public insert to orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public write to orders" ON orders FOR ALL USING (true) WITH CHECK (true);
