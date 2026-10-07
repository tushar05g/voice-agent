'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

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
    
    // Fetch agents for this client. RLS will automatically restrict this 
    // to only agents belonging to this client's email!
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
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Client Dashboard</h1>
            <p className="mt-1 text-gray-500">Welcome back, {userEmail}</p>
          </div>
          <button
            onClick={handleSignOut}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm transition hover:bg-gray-50"
          >
            Sign Out
          </button>
        </header>

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Billing Overview */}
          <div className="space-y-8 md:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-700">Current Billing Cycle</h2>
              <div className="mb-6 text-4xl font-bold text-gray-900">${totalBill.toFixed(2)}</div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Base Subscription</span>
                  <span className="font-medium">${bill.baseSubscription.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>
                    Usage ({bill.totalMinutes} mins @ ${bill.ratePerMinute}/min)
                  </span>
                  <span className="font-medium">
                    ${(bill.totalMinutes * bill.ratePerMinute).toFixed(2)}
                  </span>
                </div>
              </div>

              <button className="mt-6 w-full rounded-lg bg-gray-900 px-4 py-2 font-medium text-white transition duration-200 hover:bg-gray-800">
                View Invoice Details
              </button>
            </div>

            {/* Quick Actions (Future Data source upload could go here if enabled for clients) */}
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-4 text-lg font-semibold text-gray-700">Need Help?</h2>
              <p className="mb-4 text-sm text-gray-500">
                Want to update your agent&apos;s knowledge base or adjust its persona?
              </p>
              <button 
                onClick={handleContactSupport}
                className="w-full rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-700 transition duration-200 hover:bg-blue-100"
              >
                Submit Support Ticket
              </button>
            </div>
          </div>

          {/* Active Agents List */}
          <div className="space-y-8 md:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-800">Your Agents</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {loading ? (
                  <div className="text-gray-500 p-4">Loading your agents...</div>
                ) : agents.length === 0 ? (
                  <div className="text-gray-500 p-4 col-span-2">You don't have any active agents yet.</div>
                ) : agents.map((agent) => (
                  <div key={agent.id} className="rounded-lg border border-gray-200 p-5 transition-colors hover:border-blue-300">
                    <div className="mb-4 flex items-start justify-between">
                      <div>
                        <h3 className="text-lg font-semibold">{agent.agent_name}</h3>
                        <p className="text-sm text-gray-500">AI Assistant</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
                        Online
                      </span>
                    </div>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex justify-between">
                        <span>Phone:</span>
                        <span className="font-mono text-gray-900">{agent.phone_number}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Monthly Cost:</span>
                        <span className="font-medium text-gray-900">${agent.monthly_price}/mo</span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                      <button className="flex-1 rounded border border-gray-300 bg-white py-1.5 text-sm font-medium transition hover:bg-gray-50">
                        Call Logs
                      </button>
                      <button className="flex-1 rounded border border-gray-300 bg-white py-1.5 text-sm font-medium transition hover:bg-gray-50">
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
