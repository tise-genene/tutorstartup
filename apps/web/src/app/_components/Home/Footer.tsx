"use client";

import Link from "next/link";
import { BRAND_NAME, SUPPORT_EMAIL } from "../../../lib/brand";
import { useI18n } from "../../providers";

export function Footer() {
    const { t } = useI18n();
    const borderTopStyle = { borderTop: "1px solid var(--divider)" };

    return (
        <footer className="section-shell section-shell--tonal text-sm">
            <div className="grid gap-6 md:grid-cols-[1.5fr_1fr_1fr]">
                <div>
                    <p
                        className="text-lg font-semibold"
                        style={{ color: "var(--foreground)" }}
                    >
                        {BRAND_NAME}
                    </p>
                    <p className="mt-2 text-sm ui-muted">{t("home.footer.copy")}</p>
                </div>
                <div>
                    <p className="text-xs font-semibold tracking-[0.16em] ui-muted">
                        {t("home.footer.contact")}
                    </p>
                    <div className="mt-3 space-y-1">
                        <a
                            href={`mailto:${SUPPORT_EMAIL}`}
                            className="block underline-offset-4 hover:underline"
                        >
                            {t("home.footer.email")}
                        </a>
                        <a
                            href="tel:+251110000000"
                            className="block underline-offset-4 hover:underline"
                        >
                            {t("home.footer.phone")}
                        </a>
                        <Link
                            href="/support"
                            className="underline-offset-4 hover:underline"
                        >
                            {t("home.footer.support")}
                        </Link>
                    </div>
                </div>
                <div className="space-y-1">
                    <Link
                        href="/tutors/search"
                        className="block underline-offset-4 hover:underline"
                    >
                        {t("home.footer.links.search")}
                    </Link>
                    <Link
                        href="/tutor/profile"
                        className="block underline-offset-4 hover:underline"
                    >
                        {t("home.footer.links.profile")}
                    </Link>
                    <Link
                        href="/auth/login"
                        className="block underline-offset-4 hover:underline"
                    >
                        {t("home.footer.links.login")}
                    </Link>
                    <Link
                        href="/privacy"
                        className="block underline-offset-4 hover:underline"
                    >
                        {t("home.footer.privacy")}
                    </Link>
                    <Link
                        href="/terms"
                        className="block underline-offset-4 hover:underline"
                    >
                        {t("home.footer.terms")}
                    </Link>
                </div>
            </div>
            <div className="mt-6 pt-4 text-xs ui-muted" style={borderTopStyle}>
                © {new Date().getFullYear()} {BRAND_NAME}. All rights reserved.
            </div>
        </footer>
    );
}
