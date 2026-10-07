'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, LogOut, PhoneCall, Activity, CreditCard, LifeBuoy, Zap, FileText, UploadCloud, Settings, History, X, LayoutDashboard } from 'lucide-react';

export default function ClientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'logs'>('overview');
  const [menuTab, setMenuTab] = useState<'dashboard' | 'billing' | 'support'>('dashboard');
  
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
        phone_number: '+15550002222', monthly_price: 199,
        agent_prompt: 'You are a helpful customer support agent for our company.'
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
    const { data, error } = await supabase.from('agents').select('*');
    if (data) setAgents(data);
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
    if (!clientId) return alert("Error: Client profile not found.");
    
    const { error } = await supabase.from('support_tickets').insert([{ client_id: clientId, message }]);
    if (error) alert("Error submitting request: " + error.message);
    else alert("Your request has been sent to the support team!");
  };

  const totalBill = bill.totalMinutes * bill.ratePerMinute + agents.reduce((acc, agent) => acc + (agent.monthly_price || 0), 0);

  return (
    <div className="flex min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Left Sidebar */}
      <aside className="fixed top-0 bottom-0 left-0 w-64 border-r border-white/5 bg-[#050505] p-6 flex flex-col z-50">
        <div className="flex items-center gap-3 mb-10">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 shadow-lg shadow-indigo-500/20">
            <Bot className="h-5 w-5 text-white" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">Voice AI</span>
        </div>
        
        <nav className="flex-1 space-y-1.5">
          <button 
            onClick={() => { setMenuTab('dashboard'); setSelectedAgent(null); }}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${menuTab === 'dashboard' ? 'bg-white/10 text-white shadow' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <LayoutDashboard className="h-4 w-4" /> Overview
          </button>
          <button 
            onClick={() => setMenuTab('billing')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${menuTab === 'billing' ? 'bg-white/10 text-white shadow' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <CreditCard className="h-4 w-4" /> Billing
          </button>
          <button 
            onClick={() => setMenuTab('support')}
            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all ${menuTab === 'support' ? 'bg-white/10 text-white shadow' : 'text-zinc-400 hover:bg-white/5 hover:text-zinc-200'}`}
          >
            <LifeBuoy className="h-4 w-4" /> Support
          </button>
        </nav>
        
        <div className="mt-auto border-t border-white/5 pt-6">
          <p className="text-xs text-zinc-500 mb-4 truncate px-1">{userEmail}</p>
          <button 
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-red-400 transition-all hover:bg-red-500/10 hover:text-red-300"
          >
            <LogOut className="h-4 w-4" /> Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="ml-64 flex-1 relative min-h-screen overflow-y-auto">
        <div className="absolute top-0 right-0 h-[600px] w-[600px] rounded-full bg-indigo-600/5 blur-[150px] pointer-events-none" />
        
        <div className="p-10 max-w-6xl mx-auto relative z-10">
          
          {menuTab === 'dashboard' && !selectedAgent && (
            <div className="animate-in fade-in duration-500">
              <header className="mb-10">
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Agent Dashboard</h1>
                <p className="text-zinc-400">Manage your deployed AI voice agents.</p>
              </header>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {loading ? (
                  <div className="col-span-full flex justify-center py-12">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                  </div>
                ) : agents.length === 0 ? (
                  <div className="col-span-full rounded-2xl border border-dashed border-white/10 p-12 text-center bg-white/[0.01]">
                    <p className="text-sm text-zinc-500">No agents deployed yet.</p>
                  </div>
                ) : agents.map((agent) => (
                  <div 
                    key={agent.id} 
                    onClick={() => setSelectedAgent(agent)}
                    className="group relative rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl transition-all hover:bg-white/5 hover:border-indigo-500/30 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
                  >
                    <div className="mb-6 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-medium text-white">{agent.agent_name}</h3>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20 mt-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                        </span>
                      </div>
                      <div className="h-10 w-10 rounded-xl bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 group-hover:scale-110 transition-transform">
                        <Bot className="h-5 w-5 text-indigo-400" />
                      </div>
                    </div>
                    
                    <div className="space-y-4">
                      <div>
                        <p className="text-xs text-zinc-500 mb-1 flex items-center gap-1"><PhoneCall className="h-3 w-3"/> Assigned Number</p>
                        <p className="font-mono text-sm text-zinc-200">{agent.phone_number}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menuTab === 'dashboard' && selectedAgent && (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                onClick={() => setSelectedAgent(null)}
                className="mb-6 flex items-center gap-2 text-sm text-zinc-400 hover:text-white transition-colors"
              >
                &larr; Back to Dashboard
              </button>
              
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl min-h-[600px] flex flex-col overflow-hidden shadow-2xl">
                <div className="border-b border-white/5 bg-white/5 p-8 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                  <div>
                    <h2 className="text-2xl font-semibold text-white flex items-center gap-3">
                      {selectedAgent.agent_name}
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                      </span>
                    </h2>
                    <p className="text-sm font-mono text-zinc-400 mt-2">{selectedAgent.phone_number}</p>
                  </div>
                  
                  <div className="flex bg-black/50 p-1 rounded-xl border border-white/5">
                    <button onClick={() => setActiveTab('overview')} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>Overview</button>
                    <button onClick={() => setActiveTab('knowledge')} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'knowledge' ? 'bg-white/10 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>Knowledge Base</button>
                    <button onClick={() => setActiveTab('logs')} className={`px-5 py-2 text-sm font-medium rounded-lg transition-all ${activeTab === 'logs' ? 'bg-white/10 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}>Call Logs</button>
                  </div>
                </div>

                <div className="p-8 flex-1">
                  {activeTab === 'overview' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                        <Settings className="h-4 w-4" /> Agent Profile
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="rounded-xl border border-white/5 bg-[#050505] p-6">
                          <p className="text-xs text-zinc-500 mb-1">Agent Name</p>
                          <p className="text-sm font-medium text-white">{selectedAgent.agent_name}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#050505] p-6">
                          <p className="text-xs text-zinc-500 mb-1">Assigned Number</p>
                          <p className="text-sm font-mono text-white">{selectedAgent.phone_number}</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#050505] p-6">
                          <p className="text-xs text-zinc-500 mb-1">Base Plan</p>
                          <p className="text-sm font-medium text-white">${selectedAgent.monthly_price}/mo</p>
                        </div>
                        <div className="rounded-xl border border-white/5 bg-[#050505] p-6">
                          <p className="text-xs text-zinc-500 mb-1">Status</p>
                          <p className="text-sm font-medium text-emerald-400">Online & Ready</p>
                        </div>
                      </div>
                      <div className="mt-4 rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-sm text-indigo-200">
                        <p className="flex items-center gap-2 font-medium mb-1"><Zap className="h-4 w-4"/> AI Configuration</p>
                        <p className="text-indigo-300/70 text-xs">Core AI behaviors, prompts, and tone are managed securely by our engineering team to guarantee 99.9% uptime and quality. Need to change how the agent behaves? <button onClick={() => setMenuTab('support')} className="underline hover:text-indigo-100">Submit a support request.</button></p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'knowledge' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div>
                        <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-1">
                          <FileText className="h-5 w-5 text-indigo-400" /> Knowledge Base
                        </h3>
                        <p className="text-sm text-zinc-400">Upload documents (PDF, TXT, CSV) to instantly train your agent.</p>
                      </div>
                      <div className="border-2 border-dashed border-white/10 rounded-2xl p-16 text-center bg-[#050505] hover:bg-white/[0.02] hover:border-indigo-500/30 transition-colors cursor-pointer group">
                        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/10 mb-6 group-hover:scale-110 group-hover:bg-indigo-500/20 transition-all border border-indigo-500/10">
                          <UploadCloud className="h-10 w-10 text-indigo-400" />
                        </div>
                        <p className="text-lg font-medium text-white mb-2">Click to upload or drag and drop</p>
                        <p className="text-sm text-zinc-500">PDF, TXT, DOCX, CSV (Max 10MB)</p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'logs' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <h3 className="text-lg font-medium text-white flex items-center gap-2 mb-1">
                        <History className="h-5 w-5 text-indigo-400" /> Recent Call Logs
                      </h3>
                      <div className="rounded-xl border border-white/5 bg-[#050505] p-12 text-center">
                        <p className="text-sm text-zinc-500">No calls recorded yet.</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {menuTab === 'billing' && (
            <div className="animate-in fade-in duration-500 max-w-3xl">
              <header className="mb-10">
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Billing & Usage</h1>
                <p className="text-zinc-400">Manage your subscription and monitor platform usage.</p>
              </header>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl relative overflow-hidden shadow-xl">
                <div className="absolute top-0 right-0 p-8 opacity-5">
                  <CreditCard className="h-32 w-32" />
                </div>
                <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2 mb-4">
                  <CreditCard className="h-4 w-4" /> Current Invoice
                </h2>
                <div className="text-5xl font-semibold text-white tracking-tight mb-8">
                  ${totalBill.toFixed(2)}
                </div>
                <div className="space-y-4 text-sm relative z-10 border-t border-white/5 pt-6">
                  <div className="flex justify-between text-zinc-400">
                    <span>Base Platform Fee</span>
                    <span className="text-zinc-200">${bill.baseSubscription.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-zinc-400">
                    <span>Voice API Usage ({bill.totalMinutes}m)</span>
                    <span className="text-zinc-200">${(bill.totalMinutes * bill.ratePerMinute).toFixed(2)}</span>
                  </div>
                </div>
                <button className="mt-8 rounded-xl bg-white text-black px-6 py-3 text-sm font-semibold transition-all hover:bg-zinc-200">
                  Download PDF Invoice
                </button>
              </div>
            </div>
          )}

          {menuTab === 'support' && (
            <div className="animate-in fade-in duration-500 max-w-2xl">
              <header className="mb-10">
                <h1 className="text-3xl font-semibold tracking-tight text-white mb-2">Support Center</h1>
                <p className="text-zinc-400">Need adjustments to your agents? We are here to help.</p>
              </header>
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl shadow-xl">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-500/10 border border-indigo-500/20 mb-6">
                  <LifeBuoy className="h-8 w-8 text-indigo-400" />
                </div>
                <h2 className="text-xl font-medium text-white mb-2">Submit a Request</h2>
                <p className="mb-8 text-sm text-zinc-400 leading-relaxed">
                  Whether you need custom integrations, a new voice clone, or advanced prompt engineering, submit a ticket and our engineers will handle it securely.
                </p>
                <button 
                  onClick={handleContactSupport}
                  className="rounded-xl bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-500 focus:outline-none"
                >
                  Create Support Ticket
                </button>
              </div>
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
