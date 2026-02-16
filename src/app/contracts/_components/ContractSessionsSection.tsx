"use client";

import { useState } from "react";
import { useContractSessions } from "../../../hooks/useContractSessions";
import { SessionSchedulerModal, SessionCard, SessionCompleteModal } from "../../_components/SessionScheduler";
import type { ScheduledSession } from "../../../lib/types";

interface ContractSessionsSectionProps {
  contractId: string;
  tutorId: string;
  isParent: boolean;
}

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

export function ContractSessionsSection({ contractId, tutorId, isParent }: ContractSessionsSectionProps) {
  const {
    sessions,
    upcomingSessions,
    pastSessions,
    loading,
    createSession,
    cancelSession,
    completeSession,
    getStats,
  } = useContractSessions(contractId);

  const [showScheduler, setShowScheduler] = useState(false);
  const [editingSession, setEditingSession] = useState<ScheduledSession | null>(null);
  const [completingSession, setCompletingSession] = useState<ScheduledSession | null>(null);

  const stats = getStats();

  const handleSessionCreated = () => {
    setShowScheduler(false);
    setEditingSession(null);
  };

  const handleSessionCompleted = () => {
    setCompletingSession(null);
  };

  return (
    <div className="surface-card surface-card--quiet p-5">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "var(--foreground)" }}>
            Tutoring Sessions
          </h2>
          <p className="mt-1 text-sm ui-muted">
            Schedule and manage your tutoring sessions
          </p>
        </div>
        <button
          onClick={() => setShowScheduler(true)}
          className="ui-btn ui-btn-primary flex items-center gap-2"
        >
          <PlusIcon />
          Schedule Session
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <div className="bg-[var(--muted)]/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-[var(--accent)]">{stats.total}</div>
          <div className="text-xs text-[var(--foreground)]/60">Total Sessions</div>
        </div>
        <div className="bg-[var(--muted)]/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-green-500">{stats.completed}</div>
          <div className="text-xs text-[var(--foreground)]/60">Completed</div>
        </div>
        <div className="bg-[var(--muted)]/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-blue-500">{stats.upcoming}</div>
          <div className="text-xs text-[var(--foreground)]/60">Upcoming</div>
        </div>
        <div className="bg-[var(--muted)]/50 rounded-lg p-3 text-center">
          <div className="text-2xl font-bold text-purple-500">{stats.totalHours}h</div>
          <div className="text-xs text-[var(--foreground)]/60">Hours Taught</div>
        </div>
      </div>

      {loading && sessions.length === 0 ? (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
        </div>
      ) : sessions.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">📚</div>
          <p className="text-[var(--foreground)]/60">No sessions scheduled yet</p>
          <p className="text-sm text-[var(--foreground)]/40 mt-1">
            Schedule your first tutoring session
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]/70 uppercase tracking-wider mb-3">
                Upcoming ({upcomingSessions.length})
              </h3>
              <div className="space-y-3">
                {upcomingSessions.map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isParent={isParent}
                    onUpdate={setEditingSession}
                    onCancel={cancelSession}
                    onComplete={setCompletingSession}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Past Sessions */}
          {pastSessions.length > 0 && (
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]/70 uppercase tracking-wider mb-3">
                Past Sessions ({pastSessions.length})
              </h3>
              <div className="space-y-3">
                {pastSessions.slice(0, 5).map((session) => (
                  <SessionCard
                    key={session.id}
                    session={session}
                    isParent={isParent}
                  />
                ))}
                {pastSessions.length > 5 && (
                  <p className="text-center text-sm text-[var(--foreground)]/40 py-2">
                    +{pastSessions.length - 5} more sessions
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Schedule Session Modal */}
      {showScheduler && (
        <SessionSchedulerModal
          isOpen={true}
          onClose={() => setShowScheduler(false)}
          contractId={contractId}
          tutorId={tutorId}
          onSuccess={handleSessionCreated}
        />
      )}

      {/* Edit Session Modal */}
      {editingSession && (
        <SessionSchedulerModal
          isOpen={true}
          onClose={() => setEditingSession(null)}
          contractId={contractId}
          tutorId={tutorId}
          existingSession={editingSession}
          onSuccess={handleSessionCreated}
        />
      )}

      {/* Complete Session Modal */}
      {completingSession && (
        <SessionCompleteModal
          isOpen={true}
          onClose={() => setCompletingSession(null)}
          session={completingSession}
          onSuccess={handleSessionCompleted}
        />
      )}
    </div>
  );
}
