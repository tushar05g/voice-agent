"use client";
import { useState } from "react";
import Link from "next/link";

export default function ClientDashboard() {
  const [bill] = useState({
    totalMinutes: 1450,
    ratePerMinute: 0.15, // This includes margin, raw cost is hidden
    baseSubscription: 99.00,
  });

  const totalBill = (bill.totalMinutes * bill.ratePerMinute) + bill.baseSubscription;

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900 p-8 font-sans">
      <div className="max-w-6xl mx-auto space-y-8">
        <header className="flex justify-between items-center pb-6 border-b border-gray-200">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Client Dashboard</h1>
            <p className="text-gray-500 mt-1">Welcome back, Acme Corp.</p>
          </div>
          <Link href="/" className="px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg shadow-sm transition">Sign Out</Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Billing Overview */}
          <div className="md:col-span-1 space-y-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Current Billing Cycle</h2>
              <div className="text-4xl font-bold text-gray-900 mb-6">${totalBill.toFixed(2)}</div>
              
              <div className="space-y-3 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>Base Subscription</span>
                  <span className="font-medium">${bill.baseSubscription.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Usage ({bill.totalMinutes} mins @ ${bill.ratePerMinute}/min)</span>
                  <span className="font-medium">${(bill.totalMinutes * bill.ratePerMinute).toFixed(2)}</span>
                </div>
              </div>
              
              <button className="mt-6 w-full bg-gray-900 hover:bg-gray-800 text-white font-medium py-2 px-4 rounded-lg transition duration-200">
                View Invoice Details
              </button>
            </div>
            
            {/* Quick Actions (Future Data source upload could go here if enabled for clients) */}
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-lg font-semibold mb-4 text-gray-700">Need Help?</h2>
              <p className="text-sm text-gray-500 mb-4">Want to update your agent's knowledge base or adjust its persona?</p>
              <button className="w-full bg-blue-50 text-blue-700 hover:bg-blue-100 font-medium py-2 px-4 rounded-lg transition duration-200">
                Contact Support
              </button>
            </div>
          </div>

          {/* Active Agents List */}
          <div className="md:col-span-2 space-y-8">
            <div className="bg-white rounded-xl p-6 border border-gray-200 shadow-sm">
              <h2 className="text-xl font-semibold mb-6 text-gray-800">Your Agents</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Agent Card 1 */}
                <div className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Support Bot</h3>
                      <p className="text-sm text-gray-500">Inbound Customer Service</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                      Online
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-mono text-gray-900">+15551234567</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calls Handled:</span>
                      <span className="font-medium text-gray-900">342 this month</span>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                     <button className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium py-1.5 rounded transition">Call Logs</button>
                     <button className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium py-1.5 rounded transition">Analytics</button>
                  </div>
                </div>

                 {/* Agent Card 2 */}
                 <div className="border border-gray-200 rounded-lg p-5 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="font-semibold text-lg">Sales Outreach</h3>
                      <p className="text-sm text-gray-500">Outbound Lead Gen</p>
                    </div>
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                      Paused
                    </span>
                  </div>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex justify-between">
                      <span>Phone:</span>
                      <span className="font-mono text-gray-900">+15559876543</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Calls Handled:</span>
                      <span className="font-medium text-gray-900">0 this month</span>
                    </div>
                  </div>
                   <div className="mt-4 pt-4 border-t border-gray-100 flex gap-2">
                     <button className="flex-1 bg-white border border-gray-300 hover:bg-gray-50 text-sm font-medium py-1.5 rounded transition">Call Logs</button>
                     <button className="flex-1 bg-gray-900 hover:bg-gray-800 text-white text-sm font-medium py-1.5 rounded transition">Activate</button>
                  </div>
                </div>

              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
