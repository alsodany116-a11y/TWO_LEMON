import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';

export async function GET() {
  try {
    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin
      .from('page_config')
      .select('*')
      .eq('key', 'default')
      .single();

    if (error) {
      return NextResponse.json({
        success: false,
        error: error.message,
      });
    }

    return NextResponse.json({ success: true, config: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      sections, 
      checkout_fields, 
      price, 
      pixel_id, 
      capi_token, 
      test_event_code 
    } = body;

    const supabaseAdmin = getAdminSupabase();

    // Upsert configurations inside page_config
    const { data, error } = await supabaseAdmin
      .from('page_config')
      .upsert(
        {
          key: 'default',
          sections,
          checkout_fields,
          price: parseInt(price) || 190,
          pixel_id,
          capi_token,
          test_event_code,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      )
      .select()
      .single();

    if (error) {
      console.error('Upsert Config Error:', error);
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, config: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
