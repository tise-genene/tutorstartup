"use client";

import { useState } from "react";
import { PageShell } from "../../_components/PageShell";
import { useAuth, useI18n } from "../../providers";
import { useNotificationPreferences } from "../../../hooks/useNotifications";

function BellIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/>
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
    </svg>
  );
}

function MailIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="4" width="20" height="16" rx="2"/>
      <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
    </svg>
  );
}

function MessageIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7.9 20A9 9 0 1 0 4 16.1L2 22Z"/>
    </svg>
  );
}

function BriefcaseIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
      <line x1="16" y1="2" x2="16" y2="6"/>
      <line x1="8" y1="2" x2="8" y2="6"/>
      <line x1="3" y1="10" x2="21" y2="10"/>
    </svg>
  );
}

function DollarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" x2="12" y1="2" y2="22"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

interface ToggleSwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  icon?: React.ReactNode;
}

function ToggleSwitch({ label, description, checked, onChange, icon }: ToggleSwitchProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-[var(--border)] last:border-0">
      <div className="flex items-start gap-3">
        {icon && (
          <div className="mt-0.5 text-[var(--foreground)]/60">
            {icon}
          </div>
        )}
        <div>
          <h3 className="font-medium">{label}</h3>
          {description && (
            <p className="text-sm text-[var(--foreground)]/60 mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-12 h-6 rounded-full transition-colors ${
          checked ? "bg-[var(--accent)]" : "bg-[var(--muted)]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
            checked ? "translate-x-6" : ""
          }`}
        />
      </button>
    </div>
  );
}

export default function NotificationSettingsPage() {
  const { t } = useI18n();
  const { auth } = useAuth();
  const { preferences, loading, updatePreferences } = useNotificationPreferences(auth?.user.id || null);
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const handleToggle = async (key: keyof NonNullable<typeof preferences>, value: boolean) => {
    if (!preferences) return;
    
    setIsSaving(true);
    setSaveMessage(null);
    
    const success = await updatePreferences({ [key]: value });
    
    if (success) {
      setSaveMessage("Preferences saved successfully");
      setTimeout(() => setSaveMessage(null), 3000);
    } else {
      setSaveMessage("Failed to save preferences");
    }
    
    setIsSaving(false);
  };

  if (!auth) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl">
          <div className="glass-panel p-8 text-center">
            <p className="text-[var(--foreground)]/60">{t("state.loginRequired")}</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (loading || !preferences) {
    return (
      <PageShell>
        <div className="mx-auto max-w-3xl">
          <div className="glass-panel p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
            </div>
          </div>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="mx-auto max-w-3xl">
        <div className="glass-panel p-8">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-2xl font-semibold">Notification Settings</h1>
            <p className="mt-1 text-sm text-[var(--foreground)]/60">
              Choose which email notifications you want to receive
            </p>
          </div>

          {/* Save Message */}
          {saveMessage && (
            <div className={`mb-6 p-3 rounded-lg text-sm ${
              saveMessage.includes("success") 
                ? "bg-green-500/10 text-green-500" 
                : "bg-red-500/10 text-red-500"
            }`}>
              {saveMessage}
            </div>
          )}

          {/* Messages Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MessageIcon />
              Messages
            </h2>
            <ToggleSwitch
              label="New messages"
              description="Get notified when someone sends you a message"
              checked={preferences.newMessageEmail}
              onChange={(v) => handleToggle("newMessageEmail", v)}
              icon={<BellIcon />}
            />
          </div>

          {/* Proposals Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <BriefcaseIcon />
              Proposals & Jobs
            </h2>
            <ToggleSwitch
              label="New proposals"
              description="Get notified when someone submits a proposal to your job"
              checked={preferences.newProposalEmail}
              onChange={(v) => handleToggle("newProposalEmail", v)}
            />
            <ToggleSwitch
              label="Proposal accepted"
              description="Get notified when your proposal is accepted"
              checked={preferences.proposalAcceptedEmail}
              onChange={(v) => handleToggle("proposalAcceptedEmail", v)}
            />
            <ToggleSwitch
              label="Proposal declined"
              description="Get notified when your proposal is declined"
              checked={preferences.proposalDeclinedEmail}
              onChange={(v) => handleToggle("proposalDeclinedEmail", v)}
            />
          </div>

          {/* Interviews Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <CalendarIcon />
              Interviews
            </h2>
            <ToggleSwitch
              label="Interview scheduled"
              description="Get notified when an interview is scheduled"
              checked={preferences.interviewScheduledEmail}
              onChange={(v) => handleToggle("interviewScheduledEmail", v)}
            />
            <ToggleSwitch
              label="Interview reminders"
              description="Get reminders before upcoming interviews"
              checked={preferences.interviewReminderEmail}
              onChange={(v) => handleToggle("interviewReminderEmail", v)}
            />
            <ToggleSwitch
              label="Interview cancelled"
              description="Get notified when an interview is cancelled"
              checked={preferences.interviewCancelledEmail}
              onChange={(v) => handleToggle("interviewCancelledEmail", v)}
            />
          </div>

          {/* Contracts & Payments Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <DollarIcon />
              Contracts & Payments
            </h2>
            <ToggleSwitch
              label="Contract created"
              description="Get notified when you are hired or hire someone"
              checked={preferences.contractCreatedEmail}
              onChange={(v) => handleToggle("contractCreatedEmail", v)}
            />
            <ToggleSwitch
              label="Payment updates"
              description="Get notified about payment status changes"
              checked={preferences.paymentReceivedEmail}
              onChange={(v) => handleToggle("paymentReceivedEmail", v)}
            />
          </div>

          {/* Lesson Requests Section */}
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <MailIcon />
              Lesson Requests
            </h2>
            <ToggleSwitch
              label="Lesson requests"
              description="Get notified about new lesson requests and responses"
              checked={preferences.lessonRequestEmail}
              onChange={(v) => handleToggle("lessonRequestEmail", v)}
            />
          </div>

          {/* Marketing Section */}
          <div className="pt-8 border-t border-[var(--border)]">
            <h2 className="text-lg font-semibold mb-4">Marketing & Updates</h2>
            <ToggleSwitch
              label="Marketing emails"
              description="Receive updates about new features, promotions, and tips"
              checked={preferences.marketingEmail}
              onChange={(v) => handleToggle("marketingEmail", v)}
            />
          </div>

          {/* Footer */}
          <div className="mt-8 pt-6 border-t border-[var(--border)] text-center">
            <p className="text-sm text-[var(--foreground)]/60">
              Changes are saved automatically
            </p>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
