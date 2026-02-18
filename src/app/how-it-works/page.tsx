"use client";

import { PageShell } from "../_components/PageShell";
import Link from "next/link";

export default function HowItWorksPage() {
  return (
    <PageShell>
      <div className="mx-auto max-w-4xl space-y-12 py-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-4">How Tutorstartup Works</h1>
          <p className="text-lg text-[var(--foreground)]/60 max-w-2xl mx-auto">
            Connect with qualified tutors in 3 simple steps. Quality education made accessible.
          </p>
        </div>

        {/* For Parents Section */}
        <section className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">👨‍👩‍👧‍👦</span>
            <h2 className="text-2xl font-bold">For Parents</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--accent)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Post a Job</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                Describe your child's needs, schedule, and budget. Qualified tutors will apply.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--accent)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Review & Interview</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                Compare tutor profiles, ratings, and proposals. Schedule interviews to find the perfect match.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--accent)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">Hire & Learn</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                Send a contract offer, make secure payments, and start learning. Leave a review when complete.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/jobs/post" className="ui-btn ui-btn-primary">
              Post Your First Job
            </Link>
          </div>
        </section>

        {/* For Tutors Section */}
        <section className="glass-panel p-8">
          <div className="flex items-center gap-3 mb-6">
            <span className="text-3xl">🎓</span>
            <h2 className="text-2xl font-bold">For Tutors</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--accent)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">1</div>
              <h3 className="font-semibold mb-2">Create Profile</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                Build your professional profile showcasing your expertise, qualifications, and availability.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--accent)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">2</div>
              <h3 className="font-semibold mb-2">Apply to Jobs</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                Browse job postings and send personalized proposals to parents looking for your skills.
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-[var(--accent)] text-white rounded-full flex items-center justify-center text-xl font-bold mx-auto mb-4">3</div>
              <h3 className="font-semibold mb-2">Teach & Earn</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                Accept contract offers, deliver quality tutoring, and get paid securely through our platform.
              </p>
            </div>
          </div>

          <div className="mt-8 text-center">
            <Link href="/auth/register" className="ui-btn ui-btn-primary">
              Become a Tutor
            </Link>
          </div>
        </section>

        {/* Key Features */}
        <section className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-center mb-8">Why Choose Tutorstartup?</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-4xl mb-3">🔒</div>
              <h3 className="font-semibold mb-2">Secure Payments</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                Your money is held safely until work is completed and approved.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">✅</div>
              <h3 className="font-semibold mb-2">Verified Tutors</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                All tutors are verified and background-checked for your peace of mind.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">💬</div>
              <h3 className="font-semibold mb-2">Easy Communication</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                Built-in messaging, video calls, and interview scheduling.
              </p>
            </div>

            <div className="text-center">
              <div className="text-4xl mb-3">⭐</div>
              <h3 className="font-semibold mb-2">Quality Reviews</h3>
              <p className="text-sm text-[var(--foreground)]/60">
                Read honest reviews from other parents to make informed decisions.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ Preview */}
        <section className="glass-panel p-8">
          <h2 className="text-2xl font-bold text-center mb-6">Common Questions</h2>
          
          <div className="space-y-4 max-w-2xl mx-auto">
            <div className="border-b border-[var(--border)] pb-4">
              <h3 className="font-semibold mb-2">How much does it cost?</h3>
              <p className="text-[var(--foreground)]/70">
                It's free to post jobs and browse tutors. You only pay for tutoring services at rates you agree upon with your tutor.
              </p>
            </div>

            <div className="border-b border-[var(--border)] pb-4">
              <h3 className="font-semibold mb-2">What subjects are available?</h3>
              <p className="text-[var(--foreground)]/70">
                We cover all academic subjects from primary to high school, including Math, Science, Languages, Arts, and more.
              </p>
            </div>

            <div className="border-b border-[var(--border)] pb-4">
              <h3 className="font-semibold mb-2">Can I interview tutors before hiring?</h3>
              <p className="text-[var(--foreground)]/70">
                Yes! We encourage interviews. You can schedule video calls through our platform before making your decision.
              </p>
            </div>
          </div>

          <div className="text-center mt-6">
            <Link href="/support" className="text-[var(--accent)] hover:underline">
              View all FAQs →
            </Link>
          </div>
        </section>

        {/* CTA */}
        <section className="text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-lg text-[var(--foreground)]/60 mb-6">
            Join thousands of parents and tutors already using Tutorstartup.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link href="/jobs/post" className="ui-btn ui-btn-primary">
              Find a Tutor
            </Link>
            <Link href="/auth/register" className="ui-btn">
              Become a Tutor
            </Link>
          </div>
        </section>
      </div>
    </PageShell>
  );
}
