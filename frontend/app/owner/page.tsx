'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function OwnerDashboard() {
  const [agents, setAgents] = useState([
    { id: 1, client: 'Acme Corp', name: 'Support Bot', phone: '+15551234567', status: 'Active' },
  ]);

  const [newAgent, setNewAgent] = useState({ client: '', name: '', phone: '' });
  const [dataSource, setDataSource] = useState('');

  const handleAddAgent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newAgent.client || !newAgent.name) return;
    setAgents([
      ...agents,
      { id: Date.now(), ...newAgent, status: 'Pending', phone: newAgent.phone || 'Unassigned' },
    ]);
    setNewAgent({ client: '', name: '', phone: '' });
  };

  return (
    <div className="min-h-screen bg-gray-900 p-8 font-sans text-gray-100">
      <div className="mx-auto max-w-6xl space-y-8">
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

        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {/* Add New Agent Form */}
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl md:col-span-1">
            <h2 className="mb-4 text-xl font-semibold text-white">Provision New Agent</h2>
            <form onSubmit={handleAddAgent} className="space-y-4">
              <div>
                <label className="mb-1 block text-sm text-gray-400">Client Name</label>
                <input
                  type="text"
                  value={newAgent.client}
                  onChange={(e) => setNewAgent({ ...newAgent, client: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white transition focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Acme Corp"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm text-gray-400">Agent Name</label>
                <input
                  type="text"
                  value={newAgent.name}
                  onChange={(e) => setNewAgent({ ...newAgent, name: e.target.value })}
                  className="w-full rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white transition focus:border-blue-500 focus:outline-none"
                  placeholder="e.g. Sales Assistant"
                />
              </div>
              <button
                type="submit"
                className="w-full rounded-lg bg-blue-600 px-4 py-2 font-medium text-white transition duration-200 hover:bg-blue-500"
              >
                Deploy Agent
              </button>
            </form>

            <div className="mt-8 border-t border-gray-700 pt-6">
              <h2 className="mb-4 text-xl font-semibold text-white">Global Data Sources</h2>
              <div className="space-y-4">
                <textarea
                  value={dataSource}
                  onChange={(e) => setDataSource(e.target.value)}
                  className="h-24 w-full resize-none rounded-lg border border-gray-700 bg-gray-900 px-4 py-2 text-white transition focus:border-blue-500 focus:outline-none"
                  placeholder="Paste URL or raw text for RAG..."
                />
                <button className="w-full rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white transition duration-200 hover:bg-emerald-500">
                  Inject Knowledge
                </button>
                <p className="text-center text-xs text-gray-400">
                  Data ingested here is available to assigned agents.
                </p>
              </div>
            </div>
          </div>

          {/* Active Agents List */}
          <div className="rounded-xl border border-gray-700 bg-gray-800 p-6 shadow-xl md:col-span-2">
            <h2 className="mb-4 text-xl font-semibold text-white">Active Deployments</h2>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left">
                <thead>
                  <tr className="border-b border-gray-700 text-gray-400">
                    <th className="px-4 py-3 font-medium">Client</th>
                    <th className="px-4 py-3 font-medium">Agent</th>
                    <th className="px-4 py-3 font-medium">Phone Number</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {agents.map((agent) => (
                    <tr
                      key={agent.id}
                      className="border-b border-gray-700/50 transition hover:bg-gray-700/30"
                    >
                      <td className="px-4 py-3 text-white">{agent.client}</td>
                      <td className="px-4 py-3 text-gray-300">{agent.name}</td>
                      <td className="px-4 py-3 font-mono text-sm text-gray-400">{agent.phone}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${agent.status === 'Active' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}
                        >
                          {agent.status}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-sm font-medium text-blue-400 transition hover:text-blue-300">
                          Configure
                        </button>
                      </td>
                    </tr>
                  ))}
                  {agents.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-gray-500">
                        No agents deployed yet.
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
  );
}
