'use client';

import React, { useState } from 'react';

export default function ContactForm() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const whatsappNumber = '919542069573';
    const text = `Hello Punnami Southern Residency,
Name: ${name}
Phone: ${phone}
Message: ${message}`;

    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Full Name</label>
        <input
          type="text"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Guest Name"
          className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Mobile Number</label>
        <input
          type="tel"
          required
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +91 9XXXXXXXXX"
          className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-stone-500 mb-1.5">Message</label>
        <textarea
          rows={4}
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="How can we help you?"
          className="w-full border-2 border-stone-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-amber-500 transition-colors"
        />
      </div>
      <button
        type="submit"
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl py-3 text-sm transition-colors shadow-md"
      >
        Send via WhatsApp
      </button>
    </form>
  );
}
