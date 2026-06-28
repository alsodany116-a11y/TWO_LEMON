import { NextResponse } from 'next/server';
import { getAdminSupabase } from '@/lib/supabase';
import { sendCapiEvent } from '@/lib/capi';

export async function GET() {
  const supabaseAdmin = getAdminSupabase();
  const { data, error } = await supabaseAdmin
    .from('orders')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, orders: data });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { inputs, url } = body;

    if (!inputs || typeof inputs !== 'object') {
      return NextResponse.json({ success: false, error: 'Form inputs are required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminSupabase();

    // 1. Insert order with dynamic JSONB inputs
    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert({
        inputs,
        status: 'pending',
      })
      .select()
      .single();

    if (orderError) {
      console.error('Database Insert Error:', orderError);
      return NextResponse.json({ success: false, error: orderError.message }, { status: 500 });
    }

    // 2. Fetch page config (for Meta Pixel settings)
    const { data: config } = await supabaseAdmin
      .from('page_config')
      .select('pixel_id, capi_token, test_event_code')
      .eq('key', 'default')
      .single();

    let capiResult = null;
    
    // Find name and phone inside dynamic inputs for Meta hashing (fallback check)
    let extractedName = '';
    let extractedPhone = '';
    
    Object.keys(inputs).forEach(key => {
      const lowerKey = key.toLowerCase();
      if (lowerKey.includes('name') || lowerKey.includes('الاسم') || lowerKey.includes('اسم')) {
        extractedName = inputs[key];
      }
      if (lowerKey.includes('phone') || lowerKey.includes('الهاتف') || lowerKey.includes('رقم') || lowerKey.includes('موبايل')) {
        extractedPhone = inputs[key];
      }
    });

    if (config?.pixel_id && config?.capi_token && extractedPhone) {
      const userAgent = request.headers.get('user-agent') || '';
      const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || request.headers.get('x-real-ip') || '127.0.0.1';

      // 3. Trigger Facebook CAPI
      capiResult = await sendCapiEvent({
        pixelId: config.pixel_id,
        accessToken: config.capi_token,
        testEventCode: config.test_event_code,
        eventName: 'Purchase',
        userData: {
          name: extractedName || 'عميل ذكريات',
          phone: extractedPhone,
          userAgent,
          ip,
        },
        eventSourceUrl: url || 'http://localhost:3000',
      });

      // Update CAPI send statuses in database
      await supabaseAdmin
        .from('orders')
        .update({
          pixel_sent: capiResult.success,
          capi_response: JSON.stringify(capiResult),
        })
        .eq('id', order.id);
    }

    return NextResponse.json({
      success: true,
      order,
      capi: capiResult,
    });
  } catch (error: any) {
    console.error('Order Submit Error:', error);
    return NextResponse.json({ success: false, error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status } = body;

    if (!id || !status) {
      return NextResponse.json({ success: false, error: 'Order ID and Status are required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminSupabase();
    const { data, error } = await supabaseAdmin
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, order: data });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID is required' }, { status: 400 });
    }

    const supabaseAdmin = getAdminSupabase();
    const { error } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('id', id);

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
