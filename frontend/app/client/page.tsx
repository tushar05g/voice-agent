'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function ClientDashboard() {
  const [bill] = useState({
    totalMinutes: 1450,
    ratePerMinute: 0.15, // This includes margin, raw cost is hidden
    baseSubscription: 99.0,
  });

  const totalBill = bill.totalMinutes * bill.ratePerMinute + bill.baseSubscription;

  return (
    <div className="min-h-screen bg-gray-50 p-8 font-sans text-gray-900">
      <div className="mx-auto max-w-6xl space-y-8">
        <header className="flex items-center justify-between border-b border-gray-200 pb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-800">Client Dashboard</h1>
            <p className="mt-1 text-gray-500">Welcome back, Acme Corp.</p>
          </div>
          <Link
            href="/"
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 shadow-sm transition hover:bg-gray-50"
          >
            Sign Out
          </Link>
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
              <button className="w-full rounded-lg bg-blue-50 px-4 py-2 font-medium text-blue-700 transition duration-200 hover:bg-blue-100">
                Contact Support
              </button>
            </div>
          </div>

          {/* Active Agents List */}
          <div className="space-y-8 md:col-span-2">
            <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
              <h2 className="mb-6 text-xl font-semibold text-gray-800">Your Agents</h2>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* Agent Card 1 */}
                <div className="rounded-lg border border-gray-200 p-5 transition-colors hover:border-blue-300">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Support Bot</h3>
                      <p className="text-sm text-gray-500">Inbound Customer Service</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-emerald-100 px-2 py-1 text-xs font-medium text-emerald-700">
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
                  <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                    <button className="flex-1 rounded border border-gray-300 bg-white py-1.5 text-sm font-medium transition hover:bg-gray-50">
                      Call Logs
                    </button>
                    <button className="flex-1 rounded border border-gray-300 bg-white py-1.5 text-sm font-medium transition hover:bg-gray-50">
                      Analytics
                    </button>
                  </div>
                </div>

                {/* Agent Card 2 */}
                <div className="rounded-lg border border-gray-200 p-5 transition-colors hover:border-blue-300">
                  <div className="mb-4 flex items-start justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">Sales Outreach</h3>
                      <p className="text-sm text-gray-500">Outbound Lead Gen</p>
                    </div>
                    <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
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
                  <div className="mt-4 flex gap-2 border-t border-gray-100 pt-4">
                    <button className="flex-1 rounded border border-gray-300 bg-white py-1.5 text-sm font-medium transition hover:bg-gray-50">
                      Call Logs
                    </button>
                    <button className="flex-1 rounded bg-gray-900 py-1.5 text-sm font-medium text-white transition hover:bg-gray-800">
                      Activate
                    </button>
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
