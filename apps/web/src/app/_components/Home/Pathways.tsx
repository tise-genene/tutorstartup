"use client";

import Link from "next/link";
import { useI18n } from "../../providers";

export function Pathways() {
    const { t } = useI18n();

    const studentReasons = [
        {
            title: t("home.reasons.students.items.1.title"),
            body: t("home.reasons.students.items.1.body"),
        },
        {
            title: t("home.reasons.students.items.2.title"),
            body: t("home.reasons.students.items.2.body"),
        },
        {
            title: t("home.reasons.students.items.3.title"),
            body: t("home.reasons.students.items.3.body"),
        },
    ];

    const tutorReasons = [
        {
            title: t("home.reasons.tutors.items.1.title"),
            body: t("home.reasons.tutors.items.1.body"),
        },
        {
            title: t("home.reasons.tutors.items.2.title"),
            body: t("home.reasons.tutors.items.2.body"),
        },
        {
            title: t("home.reasons.tutors.items.3.title"),
            body: t("home.reasons.tutors.items.3.body"),
        },
    ];

    const timelineLineStyle = {
        background:
            "linear-gradient(to bottom, color-mix(in srgb, var(--foreground) 35%, transparent), transparent)",
    };

    return (
        <section className="section-shell space-y-10">
            <div className="grid gap-12 lg:grid-cols-2">
                <div>
                    <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                        {t("home.paths.student.kicker")}
                    </p>
                    <h2
                        className="mt-2 text-2xl font-semibold"
                        style={{ color: "var(--foreground)" }}
                    >
                        {t("home.reasons.students.title")}
                    </h2>
                    <p className="mt-2 text-sm ui-muted">
                        {t("home.reasons.students.body")}
                    </p>
                    <div className="mt-8 space-y-5">
                        {studentReasons.map((item) => (
                            <div key={item.title} className="relative pl-6">
                                <span
                                    className="absolute left-0 top-1 h-full w-px"
                                    style={timelineLineStyle}
                                />
                                <p
                                    className="font-semibold"
                                    style={{ color: "var(--foreground)" }}
                                >
                                    {item.title}
                                </p>
                                <p className="text-sm ui-muted">{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>

                <div>
                    <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                        {t("home.paths.tutor.kicker")}
                    </p>
                    <h2
                        className="mt-2 text-2xl font-semibold"
                        style={{ color: "var(--foreground)" }}
                    >
                        {t("home.reasons.tutors.title")}
                    </h2>
                    <p className="mt-2 text-sm ui-muted">
                        {t("home.reasons.tutors.body")}
                    </p>
                    <div className="mt-8 space-y-5">
                        {tutorReasons.map((item) => (
                            <div key={item.title} className="relative pl-6">
                                <span
                                    className="absolute left-0 top-1 h-full w-px"
                                    style={timelineLineStyle}
                                />
                                <p
                                    className="font-semibold"
                                    style={{ color: "var(--foreground)" }}
                                >
                                    {item.title}
                                </p>
                                <p className="text-sm ui-muted">{item.body}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
                <div className="surface-card p-6">
                    <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                        {t("home.paths.student.kicker")}
                    </p>
                    <p
                        className="mt-2 text-lg font-semibold"
                        style={{ color: "var(--foreground)" }}
                    >
                        {t("home.paths.student.title")}
                    </p>
                    <p className="text-sm ui-muted">{t("home.paths.student.body")}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link href="/tutors/search" className="ui-btn ui-btn-primary">
                            {t("home.paths.student.cta")}
                        </Link>
                        <Link href="/auth/login" className="ui-btn">
                            {t("home.paths.student.ctaSecondary")}
                        </Link>
                    </div>
                </div>
                <div className="surface-card surface-card--accent p-6">
                    <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                        {t("home.paths.tutor.kicker")}
                    </p>
                    <p
                        className="mt-2 text-lg font-semibold"
                        style={{ color: "var(--foreground)" }}
                    >
                        {t("home.paths.tutor.title")}
                    </p>
                    <p className="text-sm ui-muted">{t("home.paths.tutor.body")}</p>
                    <div className="mt-5 flex flex-wrap gap-3">
                        <Link href="/auth/register" className="ui-btn ui-btn-primary">
                            {t("home.paths.tutor.ctaPrimary")}
                        </Link>
                        <Link href="/tutor/profile" className="ui-btn">
                            {t("home.paths.tutor.ctaSecondary")}
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
