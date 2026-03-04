"use client";

import { useState } from "react";

export default function SupportModal() {
  const [subject, setSubject] = useState("");
  const requiresOrder =
    subject === "order" || subject === "file";

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-8 shadow-xl">

        <h3 className="text-xl font-semibold mb-2">
          Support Request
        </h3>

        <p className="text-sm text-gray-500 mb-6">
          For order and technical inquiries. We’re happy to help.
        </p>

        {/* Subject */}
        <label className="text-sm font-medium">
          Subject
        </label>
        <select
          className="w-full mt-2 mb-4 border rounded-lg p-3"
          onChange={(e) => setSubject(e.target.value)}
        >
          <option value="">Select a subject</option>
          <option value="order">
            Order Support (include order number)
          </option>
          <option value="file">
            File Access / Download Issue
          </option>
          <option value="commercial">
            Studio / Commercial Inquiry
          </option>
        </select>

        {/* Order Number Conditional */}
        {requiresOrder && (
          <>
            <label className="text-sm font-medium">
              Order Number
            </label>
            <input
              type="text"
              className="w-full mt-2 mb-4 border rounded-lg p-3"
              placeholder="Enter your order number"
            />
          </>
        )}

        {/* Email */}
        <label className="text-sm font-medium">
          Email Address
        </label>
        <input
          type="email"
          className="w-full mt-2 mb-4 border rounded-lg p-3"
          placeholder="your@email.com"
        />

        {/* Message */}
        <label className="text-sm font-medium">
          Message
        </label>
        <textarea
          className="w-full mt-2 mb-4 border rounded-lg p-3 h-24"
          placeholder="Describe your issue..."
        />

        <p className="text-xs text-gray-500 mb-4">
          We usually reply within 24 hours.
        </p>

        <p className="text-xs text-gray-400 mb-6">
          For translation or custom character consultation, please use our Custom Preview option.
        </p>

        <button className="w-full bg-black text-white py-3 rounded-lg hover:opacity-90 transition">
          Submit Request
        </button>

      </div>
    </div>
  );
}