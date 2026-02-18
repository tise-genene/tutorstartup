"use client";

import { PageShell } from "../_components/PageShell";
import Link from "next/link";

export default function SupportPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-8">
        {/* Header */}
        <div className="glass-panel p-8 sm:p-12 text-center">
          <h1 className="text-3xl font-semibold sm:text-4xl">
            How Can We Help?
          </h1>
          <p className="mt-4 text-lg text-[var(--foreground)]/60 max-w-2xl mx-auto">
            Get support, find answers, and learn how to make the most of Tutorstartup
          </p>
        </div>

        {/* Quick Help Categories */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {/* For Parents */}
          <div className="glass-panel p-6">
            <div className="text-3xl mb-4">👨‍👩‍👧‍👦</div>
            <h2 className="text-xl font-semibold mb-3">For Parents</h2>
            <ul className="space-y-2 text-sm text-[var(--foreground)]/70">
              <li>• <Link href="/how-it-works" className="text-[var(--accent)] hover:underline">How to post a job</Link></li>
              <li>• Finding the right tutor</li>
              <li>• Interviewing tutors</li>
              <li>• Managing contracts</li>
              <li>• Payment & billing</li>
            </ul>
          </div>

          {/* For Tutors */}
          <div className="glass-panel p-6">
            <div className="text-3xl mb-4">🎓</div>
            <h2 className="text-xl font-semibold mb-3">For Tutors</h2>
            <ul className="space-y-2 text-sm text-[var(--foreground)]/70">
              <li>• <Link href="/how-it-works" className="text-[var(--accent)] hover:underline">Creating your profile</Link></li>
              <li>• Applying to jobs</li>
              <li>• Setting your availability</li>
              <li>• Managing contracts</li>
              <li>• Getting paid</li>
            </ul>
          </div>

          {/* Safety & Trust */}
          <div className="glass-panel p-6">
            <div className="text-3xl mb-4">🛡️</div>
            <h2 className="text-xl font-semibold mb-3">Safety & Trust</h2>
            <ul className="space-y-2 text-sm text-[var(--foreground)]/70">
              <li>• Verification process</li>
              <li>• Safety guidelines</li>
              <li>• Reporting issues</li>
              <li>• Dispute resolution</li>
              <li>• Privacy policy</li>
            </ul>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="glass-panel p-8">
          <h2 className="text-2xl font-semibold mb-6">Frequently Asked Questions</h2>
          
          <div className="space-y-6">
            <div>
              <h3 className="font-semibold text-lg mb-2">How do I find a tutor?</h3>
              <p className="text-[var(--foreground)]/70">
                Post a job with your requirements (subject, grade level, schedule, budget). 
                Qualified tutors will apply with their proposals. You can review their profiles, 
                interview them, and choose the best match.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">How do payments work?</h3>
              <p className="text-[var(--foreground)]/70">
                Parents fund milestones upfront through our secure payment system. 
                Funds are held safely until work is completed and approved. Tutors 
                receive payment after milestone completion.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">What if I'm not satisfied?</h3>
              <p className="text-[var(--foreground)]/70">
                We encourage clear communication and setting expectations upfront. 
                If issues arise, you can request revisions or use our dispute 
                resolution process. Your funds are protected until you're satisfied.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">How are tutors verified?</h3>
              <p className="text-[var(--foreground)]/70">
                All tutors go through a verification process including identity 
                verification and qualification checks. You can also see reviews 
                from other parents to make informed decisions.
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-2">Can I interview tutors before hiring?</h3>
              <p className="text-[var(--foreground)]/70">
                Absolutely! We encourage interviews. You can schedule video calls 
                through our platform to discuss your needs, teaching approach, 
                and ensure it's a good fit before making a decision.
              </p>
            </div>
          </div>
        </div>

        {/* Contact Section */}
        <div className="glass-panel p-8 text-center">
          <h2 className="text-2xl font-semibold mb-4">Still Need Help?</h2>
          <p className="text-[var(--foreground)]/70 mb-6">
            Our support team is here to help you with any questions or issues.
          </p>
          
          <div className="flex flex-wrap justify-center gap-4">
            <a 
              href="mailto:support@tutorstartup.com" 
              className="ui-btn ui-btn-primary"
            >
              📧 Email Support
            </a>
            <a 
              href="tel:+251911234567" 
              className="ui-btn"
            >
              📞 Call Us
            </a>
          </div>

          <div className="mt-6 text-sm text-[var(--foreground)]/50">
            <p>Support Hours: Monday - Friday, 9:00 AM - 6:00 PM EAT</p>
            <p className="mt-1">Response time: Usually within 24 hours</p>
          </div>
        </div>

        {/* Trust Badges */}
        <div className="grid gap-4 md:grid-cols-3 text-center">
          <div className="p-4">
            <div className="text-2xl mb-2">🔒</div>
            <p className="font-medium">Secure Payments</p>
            <p className="text-sm text-[var(--foreground)]/60">Your money is protected</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">✅</div>
            <p className="font-medium">Verified Tutors</p>
            <p className="text-sm text-[var(--foreground)]/60">Background checked</p>
          </div>
          <div className="p-4">
            <div className="text-2xl mb-2">⭐</div>
            <p className="font-medium">Quality Guarantee</p>
            <p className="text-sm text-[var(--foreground)]/60">Satisfaction focused</p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
