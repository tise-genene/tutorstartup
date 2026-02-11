"use client";

import { useI18n } from "../../providers";

export function Faq() {
  const { t } = useI18n();

  const faqItems = [
    {
      question: t("home.faq.1.q"),
      answer: t("home.faq.1.a"),
    },
    {
      question: t("home.faq.2.q"),
      answer: t("home.faq.2.a"),
    },
    {
      question: t("home.faq.3.q"),
      answer: t("home.faq.3.a"),
    },
  ];

  return (
    <section className="section-shell space-y-12">
      <div className="max-w-2xl">
        <h2 className="text-3xl font-bold tracking-tight text-[var(--foreground)]">
          {t("home.faq.title")}
        </h2>
        <p className="mt-4 text-base ui-muted leading-relaxed">
          {t("home.faq.subtitle")}
        </p>
      </div>

      <div className="max-w-3xl space-y-2">
        {faqItems.map((item) => (
          <details
            key={item.question}
            className="group py-4 border-b border-[var(--border)] last:border-0"
          >
            <summary className="flex cursor-pointer items-center justify-between text-lg font-medium text-[var(--foreground)] hover:text-[var(--accent)] transition-colors">
              {item.question}
              <span className="ml-4 flex-shrink-0 transition-transform group-open:rotate-180">
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </summary>
            <div className="mt-4 text-base ui-muted leading-relaxed pr-8">
              {item.answer}
            </div>
          </details>
        ))}
      </div>
    </section>
  );
}
