"use client";
import { useState } from "react";
import Link from "next/link";

export default function OwnerDashboard() {
  const [agents, setAgents] = useState([
    { id: 1, client: "Acme Corp", name: "Support Bot", phone: "+15551234567", status: "Active" },
  ]);

  const [newAgent, setNewAgent] = useState({ client: "", name: "", phone: "" });
  const [dataSource, setDataSource] = useState("");

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.client || !newAgent.name) return;
    setAgents([...agents, { id: Date.now(), ...newAgent, status: "Pending", phone: newAgent.phone || "Unassigned" }]);
    setNewAgent({ client: "", name: "", phone: "" });
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center pb-6 border-b border-gray-800">
          <div>
            <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">Owner Portal</h1>
            <p className="text-gray-400 mt-1">Manage all clients, agents, and data sources.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition">Back Home</Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Add New Agent Form */}
          <div className="md:col-span-1 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Provision New Agent</h2>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="block text-sm text-gray-400 mb-1">Client Name</label>
                <input 
                  type="text" 
                  value={newAgent.client}
                  onChange={(e) => setNewAgent({...newAgent, client: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition text-white"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-1">Agent Name</label>
                <input 
                  type="text" 
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({...newAgent, name: e.target.value})}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition text-white"
                  placeholder="e.g. Sales Assistant"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                Deploy Agent
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-gray-700">
              <h2 className="text-xl font-semibold mb-4 text-white">Global Data Sources</h2>
              <div className="space-y-4">
                <textarea 
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-700 rounded-lg px-4 py-2 focus:outline-none focus:border-blue-500 transition text-white h-24 resize-none"
                  placeholder="Paste URL or raw text for RAG..."
                />
                <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                  Inject Knowledge
                </button>
                <p className="text-xs text-gray-400 text-center">Data ingested here is available to assigned agents.</p>
              </div>
            </div>
          </div>

          {/* Active Agents List */}
          <div className="md:col-span-2 bg-gray-800 rounded-xl p-6 border border-gray-700 shadow-xl">
            <h2 className="text-xl font-semibold mb-4 text-white">Active Deployments</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="py-3 px-4 font-medium">Client</th>
                    <th className="py-3 px-4 font-medium">Agent</th>
                    <th className="py-3 px-4 font-medium">Phone Number</th>
                    <th className="py-3 px-4 font-medium">Status</th>
                    <th className="py-3 px-4 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr key={agent.id} className="border-b border-gray-700/50 hover:bg-gray-700/30 transition">
                      <td className="py-3 px-4 text-white">{agent.client}</td>
                      <td className="py-3 px-4 text-gray-300">{agent.name}</td>
                      <td className="py-3 px-4 text-gray-400 font-mono text-sm">{agent.phone}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${agent.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                          {agent.status}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <button className="text-blue-400 hover:text-blue-300 text-sm font-medium transition">Configure</button>
                      </td>
                    </tr>
                  ))}
                  {agents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">No agents deployed yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
