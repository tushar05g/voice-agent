'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
  
  const [dataSource, setDataSource] = useState('');
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
      
    if (data) {
      setAgents(data);
    }
    if (error) {
      console.error('Error fetching agents:', error);
    }
    
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
      // 1. Check if client exists, if not create them
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
      
      // 2. Create the agent
      const { error: agentError } = await supabase
        .from('agents')
        .insert([{
          client_id: clientId,
          agent_name: newAgent.name,
          agent_prompt: newAgent.prompt,
          voice_id: newAgent.voiceId,
          phone_number: newAgent.phone,
          monthly_price: 199 // Default price
        }]);
        
      if (agentError) throw agentError;
      
      // Reset and refresh
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
    <div className="min-h-screen bg-gray-900 p-8 font-sans text-gray-100">
      <div className="mx-auto max-w-7xl space-y-8">
        <header className="flex items-center justify-between border-b border-gray-800 pb-6">
          <div>
            <h1 className="bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-3xl font-bold text-transparent">
              Owner Portal
            </h1>
            <p className="mt-1 text-gray-400">Manage all clients, agents, and data sources.</p>
          </div>
          <Link href="/" className="rounded-lg bg-gray-800 px-4 py-2 transition hover:bg-gray-700">
            Back Home
          </Link>
        </header>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Add New Agent Form */}
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl lg:col-span-1">
            <h2 className="mb-4 text-xl font-semibold text-white">Provision New Agent</h2>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Client Email</label>
                <input
                  type="email"
                  required
                  value={newAgent.clientEmail}
                  onChange={(e) => setNewAgent({ ...newAgent, clientEmail: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white transition focus:border-blue-500 focus:outline-none"
                  placeholder="client@company.com"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Agent Name</label>
                <input
                  type="text"
                  required
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white transition focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Sales Assistant"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Assigned Phone Number</label>
                <input
                  type="text"
                  required
                  value={newAgent.phone}
                  onChange={(e) => setNewAgent({ ...newAgent, phone: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white transition focus:border-blue-500 focus:outline-none"
                  placeholder="+1234567890"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">System Prompt</label>
                <textarea
                  required
                  value={newAgent.prompt}
                  onChange={(e) => setNewAgent({ ...newAgent, prompt: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white transition focus:border-blue-500 focus:outline-none h-24 resize-none"
                  placeholder="You are a helpful assistant..."
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition duration-200 hover:bg-blue-500 disabled:opacity-50"
              >
                {isSubmitting ? 'Deploying...' : 'Deploy Agent'}
              </button>
            </form>
          </div>

          {/* Active Agents and Tickets List */}
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl lg:col-span-2 space-y-8">
            
            {/* Deployments Table */}
            <div>
              <h2 className="mb-4 text-xl font-semibold text-white">Active Deployments</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="px-4 py-3 font-medium">Client Email</th>
                      <th className="px-4 py-3 font-medium">Agent</th>
                      <th className="px-4 py-3 font-medium">Phone Number</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          Loading agents...
                        </td>
                      </tr>
                    ) : agents.map((agent) => (
                      <tr
                        key={agent.id}
                        className="border-b border-gray-700/50 transition hover:bg-gray-700/30"
                      >
                        <td className="px-4 py-3 text-white">{agent.clients?.email || 'Unknown'}</td>
                        <td className="px-4 py-3 text-gray-300">{agent.agent_name}</td>
                        <td className="px-4 py-3 font-mono text-sm text-gray-400">{agent.phone_number}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-emerald-500/10 text-emerald-400">
                            Active
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!loading && agents.length === 0 && (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-gray-500">
                          No agents deployed yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Support Tickets Table */}
            <div className="border-t border-gray-700 pt-8">
              <h2 className="mb-4 text-xl font-semibold text-white">Client Support Tickets</h2>
              <div className="overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-gray-700 text-gray-400">
                      <th className="px-4 py-3 font-medium">Client Email</th>
                      <th className="px-4 py-3 font-medium">Message/Request</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading ? (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500">
                          Loading tickets...
                        </td>
                      </tr>
                    ) : tickets.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-gray-700/50 transition hover:bg-gray-700/30"
                      >
                        <td className="px-4 py-3 text-white">{t.clients?.email || 'Unknown'}</td>
                        <td className="px-4 py-3 text-gray-300">{t.message}</td>
                        <td className="px-4 py-3">
                          <span className="inline-flex items-center rounded-full px-2 py-1 text-xs font-medium bg-blue-500/10 text-blue-400 uppercase">
                            {t.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {!loading && tickets.length === 0 && (
                      <tr>
                        <td colSpan={3} className="py-8 text-center text-gray-500">
                          No support tickets submitted yet.
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
