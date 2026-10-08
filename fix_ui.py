with open("frontend/app/owner/page.tsx", "r") as f:
    content = f.read()

old_row = """                            <tr key={client.id} className="group border-b border-white/5 transition-colors hover:bg-white/[0.02]">
                              <td className="py-5 pl-2 font-medium text-zinc-200">{client.name || 'No Name'}</td>
                              <td className="py-5 text-zinc-400">{client.email}</td>
                              <td className="py-5 font-medium text-white">
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                                  {client.agents?.[0]?.count || 0}
                                </span>
                              </td>
                              <td className="py-5 pr-2">
                                <button 
                                  onClick={() => setEditingClient(client)}
                                  className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors border border-white/10"
                                >
                                  <Edit2 className="h-3 w-3" /> Edit
                                </button>
                              </td>
                            </tr>"""

new_row = """                            <tr key={client.id} className="group border-b border-white/5 transition-colors hover:bg-white/[0.05] cursor-pointer" onClick={() => setViewingClient(client)}>
                              <td className="py-5 pl-2 font-medium text-zinc-200">{client.name || 'No Name'}</td>
                              <td className="py-5 text-zinc-400">{client.email}</td>
                              <td className="py-5 font-medium text-white">
                                <span className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">
                                  {client.agents?.[0]?.count || 0}
                                </span>
                              </td>
                              <td className="py-5 pr-2">
                                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                                  <button 
                                    onClick={() => setEditingClient(client)}
                                    className="flex items-center gap-1.5 rounded-lg bg-white/5 px-3 py-1.5 text-xs font-medium text-white hover:bg-white/10 transition-colors border border-white/10"
                                  >
                                    <Edit2 className="h-3 w-3" /> Edit
                                  </button>
                                  <button 
                                    onClick={() => handleDeleteClient(client.id, client.name || client.email)}
                                    className="flex items-center gap-1.5 rounded-lg bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 hover:bg-red-500/20 transition-colors border border-red-500/20"
                                  >
                                    <Trash2 className="h-3 w-3" /> Delete
                                  </button>
                                </div>
                              </td>
                            </tr>"""
content = content.replace(old_row, new_row)

old_layout_start = """              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl shadow-xl">
                {!editingClient ? ("""

new_layout_start = """              <div className="rounded-2xl border border-white/5 bg-white/[0.02] p-8 backdrop-blur-xl shadow-xl">
                {!editingClient && !viewingClient ? ("""
content = content.replace(old_layout_start, new_layout_start)


# Now we find where the editing client block ends.
old_layout_end = """                  </div>
                )}
              </div>
            </div>
          )}

          {menuTab === 'provision' && ("""

new_layout_end = """                  </div>
                ) : (
                  <div className="animate-in fade-in zoom-in-95 duration-300">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <button 
                          onClick={() => setViewingClient(null)}
                          className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-zinc-300 transition-colors"
                        >
                          &larr; Back
                        </button>
                        <div>
                          <h2 className="text-xl font-medium text-white flex items-center gap-2">
                            {viewingClient.name || 'No Name'}
                          </h2>
                          <p className="text-sm text-zinc-400">{viewingClient.email}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                         <button 
                            onClick={() => { setEditingClient(viewingClient); setViewingClient(null); }}
                            className="flex items-center gap-1.5 rounded-lg bg-white/5 px-4 py-2 text-sm font-medium text-white hover:bg-white/10 transition-colors border border-white/10"
                          >
                            <Edit2 className="h-4 w-4" /> Edit Profile
                          </button>
                      </div>
                    </div>

                    <h3 className="text-lg font-medium text-white mb-4 border-b border-white/10 pb-2">Assigned Agents</h3>
                    {agents.filter(a => a.client_id === viewingClient.id).length === 0 ? (
                       <p className="text-zinc-500 py-8 text-center bg-white/5 rounded-xl border border-white/5">This client currently has no agents.</p>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {agents.filter(a => a.client_id === viewingClient.id).map(agent => (
                           <div key={agent.id} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => { setViewingClient(null); setMenuTab('dashboard'); setEditingAgent(agent); }}>
                             <div className="flex justify-between items-start mb-3">
                                <h4 className="font-medium text-white">{agent.agent_name}</h4>
                                <span className="text-xs font-mono text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-md border border-indigo-500/20">{agent.phone_number}</span>
                             </div>
                             <p className="text-xs text-zinc-400 mb-4 line-clamp-2">{agent.agent_prompt}</p>
                             <div className="flex justify-between items-center text-xs text-zinc-500">
                                <span>Voice: {agent.voice_id}</span>
                                <span>${agent.monthly_price}/mo</span>
                             </div>
                           </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {menuTab === 'provision' && ("""
content = content.replace(old_layout_end, new_layout_end)

with open("frontend/app/owner/page.tsx", "w") as f:
    f.write(content)
