'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Bot, LogOut, PhoneCall, Activity, CreditCard, LifeBuoy, Zap, FileText, UploadCloud, Settings, History, X } from 'lucide-react';

export default function ClientDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [agents, setAgents] = useState<any[]>([]);
  const [userEmail, setUserEmail] = useState('');
  const [selectedAgent, setSelectedAgent] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'knowledge' | 'logs'>('overview');
  
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
    <div className="min-h-screen bg-[#030303] text-zinc-100 font-sans selection:bg-indigo-500/30">
      
      {/* Background gradients */}
      <div className="fixed top-0 left-1/2 h-[500px] w-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-indigo-500/10 blur-[120px] pointer-events-none" />

      <div className="mx-auto max-w-7xl px-6 py-10 relative z-10">
        
        <header className="flex items-center justify-between mb-12">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-white/10 bg-white/5 shadow-xl backdrop-blur-md">
              <Bot className="h-6 w-6 text-indigo-400" />
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight text-white">Dashboard</h1>
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

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          
          {/* Sidebar */}
          <div className="space-y-6 lg:col-span-1">
            
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

            <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-6 backdrop-blur-xl">
              <h2 className="text-sm font-medium text-zinc-400 flex items-center gap-2 mb-3">
                <LifeBuoy className="h-4 w-4" /> Need Help?
              </h2>
              <p className="mb-5 text-sm text-zinc-500 leading-relaxed">
                Want to request advanced features, new integrations, or voice changes?
              </p>
              <button 
                onClick={handleContactSupport}
                className="w-full rounded-xl bg-indigo-500/10 border border-indigo-500/20 px-4 py-2.5 text-sm font-medium text-indigo-400 transition-all hover:bg-indigo-500/20 hover:text-indigo-300"
              >
                Contact Support
              </button>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {!selectedAgent ? (
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl min-h-[500px]">
                <div className="flex items-center justify-between mb-8">
                  <h2 className="text-lg font-medium text-white flex items-center gap-2">
                    <Zap className="h-5 w-5 text-indigo-400" /> Active Agents
                  </h2>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {loading ? (
                    <div className="col-span-full flex justify-center py-12">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
                    </div>
                  ) : agents.length === 0 ? (
                    <div className="col-span-full rounded-xl border border-dashed border-white/10 p-12 text-center">
                      <p className="text-sm text-zinc-500">No agents deployed yet.</p>
                    </div>
                  ) : agents.map((agent) => (
                    <div 
                      key={agent.id} 
                      onClick={() => setSelectedAgent(agent)}
                      className="group relative rounded-2xl border border-white/10 bg-white/5 p-6 transition-all hover:bg-white/10 hover:border-indigo-500/50 cursor-pointer shadow-lg hover:shadow-indigo-500/10"
                    >
                      <div className="mb-6 flex items-start justify-between">
                        <div>
                          <h3 className="text-lg font-medium text-white">{agent.agent_name}</h3>
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 border border-emerald-500/20 mt-2">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                          </span>
                        </div>
                        <div className="h-8 w-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
                          <Bot className="h-4 w-4 text-indigo-400" />
                        </div>
                      </div>
                      
                      <div className="space-y-4">
                        <div>
                          <p className="text-xs text-zinc-500 mb-1">Assigned Number</p>
                          <p className="font-mono text-sm text-zinc-200">{agent.phone_number}</p>
                        </div>
                      </div>

                      <div className="mt-6 flex items-center justify-between text-indigo-400 text-sm font-medium opacity-0 transition-opacity group-hover:opacity-100">
                        <span>Manage Agent</span>
                        <Zap className="h-4 w-4" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              /* Agent Details View */
              <div className="rounded-2xl border border-white/5 bg-white/[0.02] backdrop-blur-xl min-h-[600px] flex flex-col overflow-hidden">
                
                {/* Agent Header */}
                <div className="border-b border-white/5 bg-white/5 p-6 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => setSelectedAgent(null)}
                      className="p-2 rounded-lg hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                    >
                      <X className="h-5 w-5" />
                    </button>
                    <div>
                      <h2 className="text-xl font-medium text-white flex items-center gap-3">
                        {selectedAgent.agent_name}
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-medium text-emerald-400 border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Online
                        </span>
                      </h2>
                      <p className="text-sm font-mono text-zinc-400 mt-1">{selectedAgent.phone_number}</p>
                    </div>
                  </div>
                  
                  {/* Tabs */}
                  <div className="flex bg-black/50 p-1 rounded-lg border border-white/10">
                    <button 
                      onClick={() => setActiveTab('overview')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'overview' ? 'bg-white/10 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Overview
                    </button>
                    <button 
                      onClick={() => setActiveTab('knowledge')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'knowledge' ? 'bg-white/10 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Knowledge Base
                    </button>
                    <button 
                      onClick={() => setActiveTab('logs')}
                      className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${activeTab === 'logs' ? 'bg-white/10 text-white shadow' : 'text-zinc-500 hover:text-zinc-300'}`}
                    >
                      Call Logs
                    </button>
                  </div>
                </div>

                {/* Tab Content */}
                <div className="p-8 flex-1">
                  
                  {activeTab === 'overview' && (
                    <div className="space-y-8 animate-in fade-in duration-300">
                      <div>
                        <h3 className="text-sm font-medium text-zinc-400 flex items-center gap-2 mb-3">
                          <Settings className="h-4 w-4" /> System Instructions
                        </h3>
                        <div className="rounded-xl border border-white/5 bg-black/40 p-5 font-mono text-sm text-zinc-300 leading-relaxed whitespace-pre-wrap">
                          {selectedAgent.agent_prompt}
                        </div>
                        <p className="mt-3 text-xs text-zinc-500">
                          * To modify core agent instructions, please submit a support ticket so our engineers can optimize and test the prompt structure.
                        </p>
                      </div>
                    </div>
                  )}

                  {activeTab === 'knowledge' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div>
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                          <FileText className="h-5 w-5 text-indigo-400" /> Knowledge Base
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          Upload documents (PDF, TXT, CSV) to instantly train your agent on your company data.
                        </p>
                      </div>

                      <div className="border-2 border-dashed border-white/10 rounded-2xl p-12 text-center bg-white/[0.01] hover:bg-white/[0.03] hover:border-indigo-500/50 transition-colors cursor-pointer group">
                        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 mb-4 group-hover:scale-110 transition-transform">
                          <UploadCloud className="h-8 w-8 text-indigo-400" />
                        </div>
                        <p className="text-base font-medium text-white mb-1">Click to upload or drag and drop</p>
                        <p className="text-sm text-zinc-500">PDF, TXT, DOCX, CSV (Max 10MB)</p>
                      </div>

                      <div className="space-y-3">
                        <h4 className="text-sm font-medium text-zinc-400">Uploaded Documents (0)</h4>
                        <div className="rounded-xl border border-white/5 bg-black/40 p-8 text-center">
                          <p className="text-sm text-zinc-500">No documents uploaded yet.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {activeTab === 'logs' && (
                    <div className="space-y-6 animate-in fade-in duration-300">
                      <div>
                        <h3 className="text-lg font-medium text-white flex items-center gap-2">
                          <History className="h-5 w-5 text-indigo-400" /> Call Logs & Transcripts
                        </h3>
                        <p className="text-sm text-zinc-400 mt-1">
                          Review recent interactions, transcripts, and call analytics.
                        </p>
                      </div>
                      
                      <div className="rounded-xl border border-white/5 bg-black/40 p-8 text-center">
                        <p className="text-sm text-zinc-500">No calls recorded in the last 7 days.</p>
                      </div>
                    </div>
                  )}

                </div>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
