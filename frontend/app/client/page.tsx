'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, LogOut, PhoneCall, Activity, CreditCard, LifeBuoy, Zap } from 'lucide-react';

export default function ClientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [bill] = useState({
    totalMinutes: 0,
    ratePerMinute: 0.15,
    baseSubscription: 0,
  });

  useEffect(() => {
    checkAuthAndFetch();
  }, []);

  const checkAuthAndFetch = async () => {
    if (process.env.NEXT_PUBLIC_BYPASS_AUTH === 'true') {
      setUserEmail('demo-client@company.com');
      setAgents([{
        id: '1', client_id: '1', agent_name: 'Customer Support',
        phone_number: '+15550002222', monthly_price: 199
      }]);
      setLoading(false);
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      router.push('/');
      return;
    }
    
    setUserEmail(session.user.email || '');
    
    const { data, error } = await supabase
      .from('agents')
      .select('*');
      
    if (data) {
      setAgents(data);
    }
    
    setLoading(false);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  const handleContactSupport = async () => {
    const message = window.prompt("Please describe the issue or update you'd like to request:");
    if (!message) return;
    
    let clientId = agents.length > 0 ? agents[0].client_id : null;
    
    if (!clientId) {
       const {data} = await supabase.from('clients').select('id').eq('email', userEmail).single();
       if (data) clientId = data.id;
    }
    
    if (!clientId) {
       alert("Error: Client profile not found.");
       return;
    }
    
    const { error } = await supabase.from('support_tickets').insert([{ client_id: clientId, message }]);
    if (error) {
       alert("Error submitting request: " + error.message);
    } else {
       alert("Your request has been sent to the support team!");
    }
  };

  const totalBill = bill.totalMinutes * bill.ratePerMinute + agents.reduce((acc, agent) => acc + (agent.monthly_price || 0), 0);

  return (
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Background gradients */}
      <div className="fixed top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-6xl px-6 py-12 relative z-10">
        
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
              <Bot className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Client Portal</h1>
              <p className="text-sm text-zinc-400">{userEmail}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm font-medium text-zinc-300 transition-all hover:bg-white/10 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          
          {/* Sidebar / Stats */}
          <div className="space-y-6 lg:col-span-1">
            
            {/* Billing Card */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6 opacity-10">
                <CreditCard className="h-24 w-24" />
              </div>
              <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2 mb-2">
                <CreditCard className="h-4 w-4" /> Current Billing
              </h2>
              <div className="text-4xl font-semibold text-white tracking-tight mb-6">
                ${totalBill.toFixed(2)}
              </div>

              <div className="space-y-4 text-sm relative z-10">
                <div className="flex justify-between text-zinc-400">
                  <span>Platform Fee</span>
                  <span className="text-zinc-200">${bill.baseSubscription.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-zinc-400">
                  <span>Usage ({bill.totalMinutes}m)</span>
                  <span className="text-zinc-200">
                    ${(bill.totalMinutes * bill.ratePerMinute).toFixed(2)}
                  </span>
                </div>
              </div>

              <button className="mt-6 w-full rounded-xl bg-white/5 px-4 py-2.5 text-sm font-medium text-white transition-all hover:bg-white/10 border border-white/5">
                View Invoice
              </button>
            </div>

            {/* Support Card */}
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl">
              <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2 mb-3">
                <LifeBuoy className="h-4 w-4" /> Need Help?
              </h2>
              <p className="mb-5 text-sm text-zinc-500 leading-relaxed">
                Want to update your agent's knowledge base, prompt, or voice? Let our team know.
              </p>
              <button 
                onClick={handleContactSupport}
                className="w-full rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-400 transition-all hover:bg-indigo-500/20 hover:text-indigo-300"
              >
                Submit Support Ticket
              </button>
            </div>
          </div>

          {/* Main Content (Agents) */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl min-h-[500px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-lg font-medium text-white flex items-center gap-2">
                  <Zap className="h-5 w-5 text-indigo-400" /> Active Deployments
                </h2>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {loading ? (
                  <div className="col-span-2 flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  </div>
                ) : agents.length === 0 ? (
                  <div className="col-span-2 rounded-xl border border-dashed border-white/10 p-12 text-center">
                    <p className="text-sm text-zinc-500">No agents deployed yet.</p>
                  </div>
                ) : agents.map((agent) => (
                  <div key={agent.id} className="group relative rounded-xl border border-white/10 bg-white/5 p-5 transition-all hover:bg-white/10 hover:border-indigo-500/50">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-base font-medium text-white">{agent.agent_name}</h3>
                        <p className="text-xs text-zinc-500 mt-0.5">Voice AI Assistant</p>
                      </div>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        Online
                      </span>
                    </div>
                    
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400">
                          <PhoneCall className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Assigned Number</p>
                          <p className="font-mono text-zinc-200">{agent.phone_number}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-zinc-400">
                          <Activity className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-xs text-zinc-500">Cost Structure</p>
                          <p className="font-medium text-zinc-200">${agent.monthly_price}/mo</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 border-t border-white/10 pt-4 opacity-0 transition-opacity group-hover:opacity-100">
                      <button className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors">
                        Call Logs
                      </button>
                      <button className="flex-1 rounded-lg border border-white/10 bg-white/5 py-2 text-xs font-medium text-white hover:bg-white/10 transition-colors">
                        Analytics
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
