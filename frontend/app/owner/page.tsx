'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, LogOut, Plus, Search, MessageSquare, PhoneCall, LayoutDashboard, Ticket } from 'lucide-react';

type Agent = {
  id: string;
  client_id: string;
  agent_name: string;
  agent_prompt: string;
  voice_id: string;
  phone_number: string;
  monthly_price: number;
  status?: string;
  clients?: { email: string };
};

export default function OwnerDashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newAgent, setNewAgent] = useState({ 
    clientEmail: '', 
    name: '', 
    phone: '',
    prompt: 'You are a helpful AI assistant.',
    voiceId: 'alloy'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      setAgents([{
        id: '1', client_id: '1', agent_name: 'Test Sales Agent', agent_prompt: 'You are a sales bot',
        voice_id: 'alloy', phone_number: '+15550001111', monthly_price: 199,
        clients: { email: 'test@company.com' }
      }]);
      setTickets([{
        id: '1', client_id: '1', message: 'Can you increase the speaking speed of my agent?',
        status: 'open', clients: { email: 'test@company.com' }
      }]);
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/');
      return;
    }
    
    const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '').split(',').map(e => e.trim());
    const masterEmail = process.env.NEXT_PUBLIC_MASTER_EMAIL;
    
    const userEmail = session.user.email || '';
    
    if (!adminEmails.includes(userEmail) && userEmail !== masterEmail) {
      router.push('/client');
      return;
    }
    
    fetchAgents();
  };

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('agents')
      .select('*, clients(email)')
      .order('created_at', { ascending: false });
      
    if (data) setAgents(data);
    if (error) console.error('Error fetching agents:', error);
    
    const { data: ticketData } = await supabase
      .from('support_tickets')
      .select('*, clients(email)')
      .order('created_at', { ascending: false });
      
    if (ticketData) setTickets(ticketData);
      
    setLoading(false);
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.clientEmail || !newAgent.name || !newAgent.phone) return;
    
    setIsSubmitting(true);
    
    try {
      let clientId = '';
      const { data: existingClient } = await supabase
        .from('clients')
        .select('id')
        .eq('email', newAgent.clientEmail)
        .single();
        
      if (existingClient) {
        clientId = existingClient.id;
      } else {
        const { data: newClient, error: clientError } = await supabase
          .from('clients')
          .insert([{ email: newAgent.clientEmail }])
          .select()
          .single();
          
        if (clientError) throw clientError;
        clientId = newClient.id;
      }
      
      const { error: agentError } = await supabase
        .from('agents')
        .insert([{
          client_id: clientId,
          agent_name: newAgent.name,
          agent_prompt: newAgent.prompt,
          voice_id: newAgent.voiceId,
          phone_number: newAgent.phone,
          monthly_price: 199 
        }]);
        
      if (agentError) throw agentError;
      
      setNewAgent({ clientEmail: '', name: '', phone: '', prompt: 'You are a helpful AI assistant.', voiceId: 'alloy' });
      await fetchAgents();
      
    } catch (err) {
      console.error('Failed to create agent:', err);
      alert('Error creating agent. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Background gradients */}
      <div className="fixed top-0 right-0 h-[600px] w-[600px] -translate-y-1/2 translate-x-1/3 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 left-0 h-[600px] w-[600px] translate-y-1/2 -translate-x-1/3 rounded-full bg-blue-600/10 blur-[120px] pointer-events-none" />

      {/* Top Navbar */}
      <nav className="sticky top-0 z-50 border-b border-white/5 bg-[#030303]/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500/20 text-indigo-400">
              <Bot className="h-5 w-5" />
            </div>
            <span className="text-lg font-medium text-white tracking-tight">Admin Console</span>
          </div>
          <Link 
            href="/"
            className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-400 transition-colors hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Exit Portal
          </Link>
        </div>
      </nav>

      <div className="mx-auto max-w-7xl px-6 py-8 relative z-10">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          
          {/* Left Column: Form */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl shadow-2xl">
              <h2 className="mb-6 flex items-center gap-2 text-base font-semibold text-white">
                <Plus className="h-4 w-4 text-indigo-400" /> Provision Agent
              </h2>
              
              <form onSubmit={handleAddAgent} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 pl-1">Client Email</label>
                  <input
                    type="email"
                    required
                    value={newAgent.clientEmail}
                    onChange={(e) => setNewAgent({ ...newAgent, clientEmail: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    placeholder="client@company.com"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 pl-1">Agent Name</label>
                  <input
                    type="text"
                    required
                    value={newAgent.name}
                    onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                    placeholder="e.g. Sales Rep"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 pl-1">Inbound Phone Number</label>
                  <input
                    type="text"
                    required
                    value={newAgent.phone}
                    onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                    placeholder="+1234567890"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-zinc-400 pl-1">System Prompt</label>
                  <textarea
                    required
                    value={newAgent.prompt}
                    onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                    className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:bg-white/10 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all h-32 resize-none"
                    placeholder="You are a helpful assistant..."
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="mt-4 w-full rounded-xl bg-indigo-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                >
                  {isSubmitting ? 'Deploying...' : 'Deploy Agent'}
                </button>
              </form>
            </div>
          </div>

          {/* Right Column: Tables */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Deployments Table */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <LayoutDashboard className="h-4 w-4 text-indigo-400" /> Active Deployments
                </h2>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
                  {agents.length} Total
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500">
                      <th className="pb-3 pl-2 font-medium">Client Email</th>
                      <th className="pb-3 font-medium">Agent</th>
                      <th className="pb-3 font-medium">Phone Number</th>
                      <th className="pb-3 pr-2 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-12 text-center">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                        </td>
                      </tr>
                    ) : agents.map((agent) => (
                      <tr key={agent.id} className="group border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                        <td className="py-4 pl-2 text-white">{agent.clients?.email || 'Unknown'}</td>
                        <td className="py-4 font-medium text-zinc-200">{agent.agent_name}</td>
                        <td className="py-4 font-mono text-xs text-zinc-400">{agent.phone_number}</td>
                        <td className="py-4 pr-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Active
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!loading && agents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-12 text-center text-zinc-500">
                          No agents deployed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Support Tickets Table */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl">
              <div className="mb-6 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-white">
                  <Ticket className="h-4 w-4 text-indigo-400" /> Support Queue
                </h2>
                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-zinc-300">
                  {tickets.length} Open
                </span>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left text-sm">
                  <thead>
                    <tr className="border-b border-white/5 text-zinc-500">
                      <th className="pb-3 pl-2 font-medium w-1/4">Client</th>
                      <th className="pb-3 font-medium w-1/2">Message Request</th>
                      <th className="pb-3 pr-2 font-medium w-1/4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-zinc-300">
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="py-12 text-center">
                          <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                        </td>
                      </tr>
                    ) : tickets.map((t) => (
                      <tr key={t.id} className="group border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                        <td className="py-4 pl-2 text-white">{t.clients?.email || 'Unknown'}</td>
                        <td className="py-4 text-zinc-400 pr-4">{t.message}</td>
                        <td className="py-4 pr-2">
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-400 border border-amber-500/20 uppercase tracking-wider">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!loading && tickets.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-12 text-center text-zinc-500">
                          Inbox zero! No active support tickets.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
