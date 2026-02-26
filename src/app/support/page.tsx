"use client";

import { PageShell } from "../_components/PageShell";
import Link from "next/link";
import { useState } from "react";

function MailIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
    </svg>
  );
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
    </svg>
  );
}

const faqs = [
  {
    q: "How do I find a tutor?",
    a: "Post a job with your requirements. Qualified tutors will apply with proposals. Review their profiles, interview them, and choose the best match."
  },
  {
    q: "How do payments work?",
    a: "Parents fund milestones upfront through our secure system. Funds are held safely until work is completed and approved."
  },
  {
    q: "What if I'm not satisfied?",
    a: "We encourage clear communication upfront. If issues arise, request revisions or use our dispute resolution process. Your funds are protected."
  },
  {
    q: "How are tutors verified?",
    a: "All tutors go through verification including identity and qualification checks. You can also see reviews from other parents."
  },
  {
    q: "Can I interview tutors before hiring?",
    a: "Absolutely! Schedule video calls through our platform to discuss your needs and ensure it's a good fit."
  }
];

export default function SupportPage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <PageShell>
      <div className="max-w-3xl mx-auto space-y-12">
        {/* Header */}
        <div className="text-center space-y-4 pt-8">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            How Can We Help?
          </h1>
          <p className="text-lg text-[var(--foreground)]/60 max-w-lg mx-auto">
            Find answers, get support, and learn how to make the most of TutorHub
          </p>
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Link
            href="/how-it-works"
            className="surface-panel p-4 text-center card-hover"
          >
            <p className="font-medium text-sm">How It Works</p>
          </Link>
          <Link
            href="/tutors/search"
            className="surface-panel p-4 text-center card-hover"
          >
            <p className="font-medium text-sm">Find a Tutor</p>
          </Link>
          <Link
            href="/auth/register"
            className="surface-panel p-4 text-center card-hover"
          >
            <p className="font-medium text-sm">Become a Tutor</p>
          </Link>
        </div>

        {/* FAQ */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Frequently Asked Questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="surface-panel overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between p-4 text-left"
                >
                  <span className="font-medium text-sm">{faq.q}</span>
                  <ChevronIcon open={openFaq === i} />
                </button>
                {openFaq === i && (
                  <div className="px-4 pb-4 text-sm text-[var(--foreground)]/70 animate-slide-down">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <div className="surface-panel p-6 text-center space-y-4">
          <h3 className="font-semibold">Still need help?</h3>
          <p className="text-sm text-[var(--foreground)]/60">
            Our team is available Mon-Fri, 9AM-6PM EAT
          </p>
          <div className="flex justify-center gap-3">
            <a href="mailto:support@tutorhub.com" className="ui-btn ui-btn-primary text-sm">
              <MailIcon />
              <span className="ml-2">Email</span>
            </a>
            <a href="tel:+251911234567" className="ui-btn ui-btn-secondary text-sm">
              <PhoneIcon />
              <span className="ml-2">Call</span>
            </a>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
