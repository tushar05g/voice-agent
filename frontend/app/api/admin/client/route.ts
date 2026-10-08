import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

// We need to verify the user is actually an admin before allowing the service role key to do anything.
async function verifyAdmin(request: Request) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
    { global: { headers: { Authorization: authHeader } } }
  );

  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !user.email) return false;

  const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
  const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL;

  return adminEmails.includes(user.email) || user.email === masterEmail;
}

export async function PUT(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    
    if (!isAdmin && process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, name, email } = body;

    if (!id || !email) {
      return NextResponse.json({ error: 'Client ID and Email are required' }, { status: 400 });
    }

    const { error: clientError } = await supabaseAdmin.from('clients').update({
      name,
      email
    }).eq('id', id);

    if (clientError) throw clientError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    
    if (!isAdmin && process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Client ID is required' }, { status: 400 });
    }

    const { error: deleteError } = await supabaseAdmin.from('clients').delete().eq('id', id);

    if (deleteError) throw deleteError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
