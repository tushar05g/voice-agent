'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, LogOut, Plus, Search, MessageSquare, PhoneCall, LayoutDashboard, Ticket, Users, Edit2, X } from 'lucide-react';

type Agent = {
  id: string;
  client_id: string;
  agent_name: string;
  agent_prompt: string;
  voice_id: string;
  phone_number: string;
  monthly_price: number;
  status?: string;
  clients?: { email: string; name?: string };
};

export default function OwnerDashboard() {
  const router = useRouter();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [menuTab, setMenuTab] = useState<'dashboard' | 'provision' | 'support'>('dashboard');
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  
  const [newAgent, setNewAgent] = useState({ 
    clientEmail: '', 
    clientName: '',
    name: '', 
    phone: '',
    prompt: 'You are a helpful AI assistant.',
    voiceId: 'alloy'
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [userEmail, setUserEmail] = useState('');

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      setUserEmail('admin@voiceagent.in');
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
    const sessionEmail = session.user.email || '';
    
    if (!adminEmails.includes(sessionEmail) && sessionEmail !== masterEmail) {
      router.push('/dashboard');
      return;
    }
    
    setUserEmail(sessionEmail);
    fetchAgents();
  };

  const fetchAgents = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('agents').select('*, clients(email, name)').order('created_at', { ascending: false });
    if (data) setAgents(data);
    
    const { data: ticketData } = await supabase.from('support_tickets').select('*, clients(email, name)').order('created_at', { ascending: false });
    if (ticketData) setTickets(ticketData);
      
    setLoading(false);
  };

  const handleAddAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.clientEmail || !newAgent.name || !newAgent.phone) return;
    setIsSubmitting(true);
    
      try {
      let clientId = '';
      const { data: existingClient } = await supabase.from('clients').select('id, name').eq('email', newAgent.clientEmail).single();
        
      if (existingClient) {
        clientId = existingClient.id;
        if (newAgent.clientName && existingClient.name !== newAgent.clientName) {
           await supabase.from('clients').update({ name: newAgent.clientName }).eq('id', clientId);
        }
      } else {
        const { data: newClient, error: clientError } = await supabase.from('clients').insert([{ email: newAgent.clientEmail, name: newAgent.clientName }]).select().single();
        if (clientError) throw clientError;
        clientId = newClient.id;
      }
      
      const { error: agentError } = await supabase.from('agents').insert([{
        client_id: clientId,
        agent_name: newAgent.name,
        agent_prompt: newAgent.prompt,
        voice_id: newAgent.voiceId,
        phone_number: newAgent.phone,
        monthly_price: 199 
      }]);
        
      if (agentError) throw agentError;
      
      setNewAgent({ clientEmail: '', clientName: '', name: '', phone: '', prompt: 'You are a helpful AI assistant.', voiceId: 'alloy' });
      await fetchAgents();
      setMenuTab('dashboard');
      
    } catch (err) {
      alert('Error creating agent. Check console for details.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateAgent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgent) return;
    setIsUpdating(true);
    
    try {
      const { error } = await supabase.from('agents').update({
        agent_name: editingAgent.agent_name,
        agent_prompt: editingAgent.agent_prompt,
        phone_number: editingAgent.phone_number,
        monthly_price: editingAgent.monthly_price,
      }).eq('id', editingAgent.id);
      
      if (error) throw error;
      
      if (editingAgent.clients?.email || editingAgent.clients?.name) {
        const { error: clientError } = await supabase.from('clients').update({
          email: editingAgent.clients.email,
          name: editingAgent.clients.name
        }).eq('id', editingAgent.client_id);
        if (clientError) throw clientError;
      }
      
      await fetchAgents();
      setEditingAgent(null);
    } catch (err) {
      alert('Error updating agent.');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Left Sidebar */}
      <aside className="fixed top-0 bottom-0 left-0 w-64 border-r border-white/5 bg-[#050505] p-6 flex flex-col z-50">
        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 shadow-lg shadow-indigo-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Admin Console</span>
        </div>
        
        <nav className="flex-1 space-y-1.5">
          <button 
            onClick={() => { setMenuTab('dashboard'); setEditingAgent(null); }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${menuTab === 'dashboard' ? 'bg-white/10 text-white shadow' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <LayoutDashboard className="h-4 w-4" /> Global Deployments
          </button>
          <button 
            onClick={() => setMenuTab('provision')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${menuTab === 'provision' ? 'bg-white/10 text-white shadow' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <Plus className="h-4 w-4" /> Provision Agent
          </button>
          <button 
            onClick={() => setMenuTab('support')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${menuTab === 'support' ? 'bg-white/10 text-white shadow' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <Ticket className="h-4 w-4" /> Support Queue
          </button>
        </nav>
        
        <div className="mt-auto border-t border-white/5 pt-6">
          <p className="text-xs text-zinc-500 mb-4 truncate px-1">{userEmail}</p>
          <Link 
            href="/"
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-zinc-400 transition-all hover:bg-white/5 hover:text-white"
          >
            <LogOut className="h-4 w-4" /> Exit Portal
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 relative min-h-screen overflow-y-auto">
        <div className="absolute top-0 left-0 h-[600px] w-[600px] rounded-full bg-violet-600/5 blur-[150px] pointer-events-none" />
        
        <div className="p-10 max-w-7xl mx-auto relative z-10">
          
          {menuTab === 'dashboard' && (
            <div className="animate-in fade-in duration-500">
              <header className="mb-10">
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Fleet Status</h1>
                <p className="text-zinc-400">Monitor all client deployments globally.</p>
              </header>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl shadow-xl">
                {!editingAgent ? (
                  <>
                    <div className="mb-8 flex items-center justify-between">
                      <h2 className="text-lg font-medium text-white flex items-center gap-2">
                        <Users className="h-5 w-5 text-indigo-400" /> Active Agents
                      </h2>
                      <span className="rounded-full bg-indigo-500/10 px-4 py-1 text-xs font-medium text-indigo-400 border border-indigo-500/20">
                        {agents.length} Total
                      </span>
                    </div>
                    
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-sm">
                        <thead>
                          <tr className="border-b border-white/10 text-zinc-500">
                            <th className="pb-4 pl-2 font-medium">Client</th>
                            <th className="pb-4 font-medium">Agent</th>
                            <th className="pb-4 font-medium">Phone Number</th>
                            <th className="pb-4 pr-2 font-medium">Actions</th>
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
                              <td className="py-5 pl-2 text-white">
                                <div>{agent.clients?.name || 'No Name'}</div>
                                <div className="text-xs text-zinc-500">{agent.clients?.email || 'Unknown'}</div>
                              </td>
                              <td className="py-5 font-medium text-zinc-200">{agent.agent_name}</td>
                              <td className="py-5 font-mono text-xs text-zinc-400">{agent.phone_number}</td>
                              <td className="py-5 pr-2">
                                <button 
                                  onClick={() => setEditingAgent(agent)}
                                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors border border-white/10"
                                >
                                  <Edit2 className="h-3 w-3" /> Edit
                                </button>
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
                  </>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-medium text-white flex items-center gap-2">
                        <Edit2 className="h-5 w-5 text-indigo-400" /> Edit Agent Profile
                      </h2>
                      <button 
                        onClick={() => setEditingAgent(null)}
                        className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
                      >
                        <X className="h-5 w-5" />
                      </button>
                    </div>
                    
                    <form onSubmit={handleUpdateAgent} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-zinc-400">Client Name</label>
                          <input
                            type="text"
                            value={editingAgent.clients?.name || ''}
                            onChange={(e) => setEditingAgent({ ...editingAgent, clients: { ...editingAgent.clients, name: e.target.value } as any })}
                            className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-zinc-400">Client Email</label>
                          <input
                            type="email"
                            required
                            value={editingAgent.clients?.email || ''}
                            onChange={(e) => setEditingAgent({ ...editingAgent, clients: { ...editingAgent.clients, email: e.target.value } as any })}
                            className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-zinc-400">Agent Name</label>
                          <input
                            type="text"
                            required
                            value={editingAgent.agent_name}
                            onChange={(e) => setEditingAgent({ ...editingAgent, agent_name: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-zinc-400">Phone Number</label>
                          <input
                            type="text"
                            required
                            value={editingAgent.phone_number}
                            onChange={(e) => setEditingAgent({ ...editingAgent, phone_number: e.target.value })}
                            className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 font-mono"
                          />
                        </div>
                      </div>
                      
                      <div className="space-y-1.5">
                        <label className="text-sm font-medium text-zinc-400">System Prompt</label>
                        <textarea
                          required
                          value={editingAgent.agent_prompt}
                          onChange={(e) => setEditingAgent({ ...editingAgent, agent_prompt: e.target.value })}
                          className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-4 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 h-40 resize-none font-mono"
                        />
                      </div>
                      
                      <div className="space-y-1.5 w-1/3">
                        <label className="text-sm font-medium text-zinc-400">Monthly Price ($)</label>
                        <input
                          type="number"
                          required
                          value={editingAgent.monthly_price}
                          onChange={(e) => setEditingAgent({ ...editingAgent, monthly_price: Number(e.target.value) })}
                          className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50"
                        />
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-4 border-t border-white/5">
                        <button
                          type="button"
                          onClick={() => setEditingAgent(null)}
                          className="rounded-xl px-5 py-2.5 text-sm font-medium text-zinc-300 hover:text-white hover:bg-white/5 transition-all"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isUpdating}
                          className="rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 focus:outline-none disabled:opacity-50"
                        >
                          {isUpdating ? 'Saving...' : 'Save Changes'}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          )}

          {menuTab === 'provision' && (
            <div className="animate-in fade-in duration-500 max-w-2xl">
              <header className="mb-10">
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Deploy Agent</h1>
                <p className="text-zinc-400">Provision a new voice AI agent for a client.</p>
              </header>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl shadow-xl">
                <form onSubmit={handleAddAgent} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-400">Client Name</label>
                      <input
                        type="text"
                        value={newAgent.clientName}
                        onChange={(e) => setNewAgent({ ...newAgent, clientName: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        placeholder="John Doe"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-medium text-zinc-400">Client Email</label>
                      <input
                        type="email"
                        required
                        value={newAgent.clientEmail}
                        onChange={(e) => setNewAgent({ ...newAgent, clientEmail: e.target.value })}
                        className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                        placeholder="client@company.com"
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">Agent Name</label>
                    <input
                      type="text"
                      required
                      value={newAgent.name}
                      onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all"
                      placeholder="e.g. Sales Rep"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">Inbound Phone Number</label>
                    <input
                      type="text"
                      required
                      value={newAgent.phone}
                      onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-3 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all font-mono"
                      placeholder="+1234567890"
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-zinc-400">System Prompt</label>
                    <textarea
                      required
                      value={newAgent.prompt}
                      onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                      className="w-full rounded-xl border border-white/10 bg-[#050505] px-4 py-4 text-sm text-white placeholder:text-zinc-600 focus:border-indigo-500/50 focus:outline-none focus:ring-1 focus:ring-indigo-500/50 transition-all h-40 resize-none font-mono"
                      placeholder="You are a helpful assistant..."
                    />
                  </div>
                  
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="mt-6 w-full rounded-xl bg-indigo-600 px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 disabled:opacity-50"
                  >
                    {isSubmitting ? 'Deploying...' : 'Deploy Agent'}
                  </button>
                </form>
              </div>
            </div>
          )}

          {menuTab === 'support' && (
            <div className="animate-in fade-in duration-500">
              <header className="mb-10">
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Support Queue</h1>
                <p className="text-zinc-400">Resolve client requests and prompt adjustments.</p>
              </header>

              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl shadow-xl">
                <div className="mb-8 flex items-center justify-between">
                  <h2 className="text-lg font-medium text-white flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-indigo-400" /> Active Tickets
                  </h2>
                  <span className="rounded-full bg-amber-500/10 px-4 py-1 text-xs font-medium text-amber-400 border border-amber-500/20">
                    {tickets.length} Open
                  </span>
                </div>
                
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-sm">
                    <thead>
                      <tr className="border-b border-white/10 text-zinc-500">
                        <th className="pb-4 pl-2 font-medium w-1/4">Client</th>
                        <th className="pb-4 font-medium w-1/2">Message / Request</th>
                        <th className="pb-4 pr-2 font-medium w-1/4">Status</th>
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
                          <td className="py-5 pl-2 text-white">{t.clients?.email || 'Unknown'}</td>
                          <td className="py-5 text-zinc-400 pr-4">{t.message}</td>
                          <td className="py-5 pr-2">
                            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-400 border border-amber-500/20 uppercase tracking-wider">
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
          )}

        </div>
      </main>
    </div>
  );
}
