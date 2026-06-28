import { getAdminSupabase } from '@/lib/supabase';
import LandingPageClient from './page-client';

export const revalidate = 0; // Disable static rendering cache

export default async function LandingPage() {
  const supabaseAdmin = getAdminSupabase();

  // Fetch configs, checkout fields list, and price
  const { data: config } = await supabaseAdmin
    .from('page_config')
    .select('*')
    .eq('key', 'default')
    .single();

  const sections = config?.sections || [];
  const checkoutFields = config?.checkout_fields || [
    { id: 'name', label: 'الاسم بالكامل', type: 'text', required: true, placeholder: 'أدخل اسمك الثلاثي' },
    { id: 'phone', label: 'رقم الهاتف للاتصال', type: 'tel', required: true, placeholder: 'مثال: 01012345678' },
    { id: 'whatsapp', label: 'رقم الواتساب (اختياري)', type: 'tel', required: false, placeholder: 'مثال: 01012345678' }
  ];
  const price = config?.price || 190;

  return (
    <LandingPageClient 
      initialSections={sections} 
      checkoutFields={checkoutFields} 
      price={price} 
    />
  );
}
