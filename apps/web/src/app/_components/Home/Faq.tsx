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

    const borderTopStyle = { borderTop: "1px solid var(--divider)" };

    return (
        <section className="section-shell section-shell--tonal">
            <div className="flex flex-col gap-2">
                <h2
                    className="text-2xl font-semibold"
                    style={{ color: "var(--foreground)" }}
                >
                    {t("home.faq.title")}
                </h2>
                <p className="text-sm ui-muted">{t("home.faq.subtitle")}</p>
            </div>
            <div className="mt-6">
                {faqItems.map((item, index) => (
                    <details
                        key={item.question}
                        className="py-4 transition"
                        style={index === 0 ? undefined : borderTopStyle}
                    >
                        <summary
                            className="cursor-pointer text-lg font-semibold"
                            style={{ color: "var(--foreground)" }}
                        >
                            {item.question}
                        </summary>
                        <p className="mt-3 text-sm ui-muted">{item.answer}</p>
                    </details>
                ))}
            </div>
        </section>
    );
}
