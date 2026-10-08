import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { createClient } from '@supabase/supabase-js';

// We need to verify the user is actually an admin before allowing the service role key to do anything.
async function verifyAdmin(request: Request) {
  // Get the auth header containing the user's token
  const authHeader = request.headers.get('Authorization');
  if (!authHeader) return false;

  // We need to verify their token using the normal Supabase client
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
    
    // In dev mode with bypass auth, allow it
    if (!isAdmin && process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { id, agent_name, agent_prompt, phone_number, monthly_price, client_id, clients } = body;

    // Use the admin client to bypass RLS
    const { error: agentError } = await supabaseAdmin.from('agents').update({
      agent_name,
      agent_prompt,
      phone_number,
      monthly_price,
    }).eq('id', id);

    if (agentError) throw agentError;

    if (client_id && client_id !== id) { // Allow reassigning to a different client id if provided, but don't mutate the clients table
      const { error: reassignmentError } = await supabaseAdmin.from('agents').update({
        client_id
      }).eq('id', id);
      if (reassignmentError) throw reassignmentError;
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const isAdmin = await verifyAdmin(request);
    
    if (!isAdmin && process.env.NEXT_PUBLIC_BYPASS_AUTH !== 'true') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { clientEmail, clientName, name, phone, prompt, voiceId } = body;

    let clientId = '';
    const { data: existingClient } = await supabaseAdmin.from('clients').select('id, name').eq('email', clientEmail).single();
      
    if (existingClient) {
      clientId = existingClient.id;
      if (clientName && existingClient.name !== clientName) {
         await supabaseAdmin.from('clients').update({ name: clientName }).eq('id', clientId);
      }
    } else {
      const { data: newClient, error: clientError } = await supabaseAdmin.from('clients').insert([{ email: clientEmail, name: clientName }]).select().single();
      if (clientError) throw clientError;
      clientId = newClient.id;
    }

    const { error: agentError } = await supabaseAdmin.from('agents').insert([{
      client_id: clientId,
      agent_name: name,
      phone_number: phone,
      agent_prompt: prompt,
      voice_id: voiceId
    }]);
      
    if (agentError) throw agentError;

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('API Error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
