"use client";

import { useState, useEffect } from "react";
import { useContractSessions, CreateSessionPayload } from "../../hooks/useContractSessions";
import { useTutorAvailability } from "../../hooks/useInterviews";
import { useAuth } from "../../app/providers";
import type { ScheduledSession } from "../../lib/types";

interface SessionSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  contractId: string;
  tutorId: string;
  existingSession?: ScheduledSession | null;
  onSuccess?: (session: ScheduledSession) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DURATION_OPTIONS = [30, 45, 60, 90, 120];

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function CalendarIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
      <line x1="16" y1="2" x2="16" y2="6"></line>
      <line x1="8" y1="2" x2="8" y2="6"></line>
      <line x1="3" y1="10" x2="21" y2="10"></line>
    </svg>
  );
}

function LocationIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
      <circle cx="12" cy="10" r="3"></circle>
    </svg>
  );
}

export function SessionSchedulerModal({
  isOpen,
  onClose,
  contractId,
  tutorId,
  existingSession,
  onSuccess,
}: SessionSchedulerModalProps) {
  const { auth } = useAuth();
  const { createSession, updateSession } = useContractSessions(contractId);
  const { getAvailableSlots } = useTutorAvailability(tutorId);
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(60);
  const [meetingLink, setMeetingLink] = useState<string>("");
  const [locationText, setLocationText] = useState<string>("");
  const [notes, setNotes] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<Array<{ startTime: string; endTime: string; isAvailable: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"date" | "time" | "details">("date");

  // Set initial values if editing existing session
  useEffect(() => {
    if (existingSession) {
      const date = new Date(existingSession.scheduledAt);
      setSelectedDate(date.toISOString().split('T')[0]);
      setSelectedTime(date.toTimeString().slice(0, 5));
      setDuration(existingSession.durationMinutes);
      setMeetingLink(existingSession.meetingLink || "");
      setLocationText(existingSession.locationText || "");
      setNotes(existingSession.notes || "");
    }
  }, [existingSession]);

  // Fetch available slots when date changes
  useEffect(() => {
    if (selectedDate) {
      getAvailableSlots(selectedDate, duration).then(setAvailableSlots);
      setStep("time");
    }
  }, [selectedDate, duration, getAvailableSlots]);

  if (!isOpen) return null;

  const handleDateSelect = (date: string) => {
    setSelectedDate(date);
    setSelectedTime("");
  };

  const handleTimeSelect = (time: string) => {
    setSelectedTime(time);
    setStep("details");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate || !selectedTime) return;

    setIsLoading(true);
    setError(null);

    const scheduledAt = new Date(`${selectedDate}T${selectedTime}`).toISOString();

    let result;
    if (existingSession) {
      result = await updateSession(existingSession.id, {
        scheduledAt,
        durationMinutes: duration,
        meetingLink: meetingLink || undefined,
        locationText: locationText || undefined,
        notes: notes || undefined,
      });
    } else {
      result = await createSession({
        contractId,
        scheduledAt,
        durationMinutes: duration,
        meetingLink: meetingLink || undefined,
        locationText: locationText || undefined,
        notes: notes || undefined,
      });
    }

    if (result) {
      onSuccess?.(result);
      onClose();
    } else {
      setError("Failed to schedule session. Please try again.");
    }

    setIsLoading(false);
  };

  // Generate next 30 days
  const getNext30Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      days.push({
        date: date.toISOString().split('T')[0],
        dayName: DAYS[date.getDay()],
        dayNumber: date.getDate(),
        month: date.toLocaleDateString('en-US', { month: 'short' }),
      });
    }
    return days;
  };

  const next30Days = getNext30Days();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative w-full max-w-2xl rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-scale-in max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-semibold">
                {existingSession ? "Reschedule Session" : "Schedule Tutoring Session"}
              </h2>
              <p className="text-sm text-[var(--foreground)]/60 mt-1">
                {existingSession ? "Update the session details" : "Book a new tutoring session"}
              </p>
            </div>
            <button
              onClick={onClose}
              className="ui-btn ui-btn-ghost p-2"
            >
              ✕
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Select Date */}
          <div className="mb-6">
            <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
              <CalendarIcon />
              1. Select a Date
            </h3>
            <div className="grid grid-cols-7 gap-2 max-h-48 overflow-y-auto">
              {next30Days.map((day) => (
                <button
                  key={day.date}
                  onClick={() => handleDateSelect(day.date)}
                  className={`flex flex-col items-center p-2 rounded-lg border transition-colors ${
                    selectedDate === day.date
                      ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                      : "border-[var(--border)] hover:bg-[var(--muted)]"
                  }`}
                >
                  <span className="text-xs opacity-60">{day.dayName}</span>
                  <span className="text-lg font-semibold">{day.dayNumber}</span>
                  <span className="text-xs opacity-60">{day.month}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Step 2: Select Time */}
          {(step === "time" || step === "details") && selectedDate && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-medium">2. Select a Time</h3>
                <select
                  value={duration}
                  onChange={(e) => setDuration(Number(e.target.value))}
                  className="text-sm border border-[var(--border)] rounded-md px-2 py-1 bg-[var(--input)]"
                >
                  {DURATION_OPTIONS.map((d) => (
                    <option key={d} value={d}>{d} minutes</option>
                  ))}
                </select>
              </div>
              
              {availableSlots.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots
                    .filter(slot => slot.isAvailable)
                    .map((slot) => (
                      <button
                        key={slot.startTime}
                        onClick={() => handleTimeSelect(slot.startTime.slice(0, 5))}
                        className={`p-2 rounded-lg border text-sm transition-colors ${
                          selectedTime === slot.startTime.slice(0, 5)
                            ? "border-[var(--accent)] bg-[var(--accent)]/10 text-[var(--accent)]"
                            : "border-[var(--border)] hover:bg-[var(--muted)]"
                        }`}
                      >
                        {slot.startTime.slice(0, 5)}
                      </button>
                    ))}
                </div>
              ) : (
                <div className="p-4 text-center text-[var(--foreground)]/60 bg-[var(--muted)]/50 rounded-lg">
                  No available slots for this date. The tutor hasn't set availability or all slots are booked.
                </div>
              )}
            </div>
          )}

          {/* Step 3: Session Details */}
          {step === "details" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Location/Meeting Link */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Meeting Link (for online)
                  </label>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://zoom.us/j/..."
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2 flex items-center gap-1">
                    <LocationIcon />
                    Location (for in-person)
                  </label>
                  <input
                    type="text"
                    value={locationText}
                    onChange={(e) => setLocationText(e.target.value)}
                    placeholder="Student's home, Library, etc."
                    className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  Session Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Topics to cover, materials needed, special instructions..."
                  className="w-full min-h-[80px] border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm resize-none"
                  rows={3}
                />
              </div>

              {/* Summary */}
              <div className="p-3 bg-[var(--muted)]/50 rounded-lg">
                <p className="text-sm font-medium mb-1">Session Summary:</p>
                <p className="text-sm text-[var(--foreground)]/70">
                  {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                  {selectedTime && ` at ${selectedTime}`}
                  {duration && ` • ${duration} minutes`}
                </p>
              </div>

              {/* Actions */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="ui-btn ui-btn-ghost"
                  disabled={isLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="ui-btn ui-btn-primary"
                  disabled={!selectedDate || !selectedTime || isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Scheduling...
                    </span>
                  ) : existingSession ? (
                    "Update Session"
                  ) : (
                    "Schedule Session"
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Navigation for steps */}
          {step !== "details" && (
            <div className="flex justify-end gap-3 pt-4">
              <button
                onClick={onClose}
                className="ui-btn ui-btn-ghost"
              >
                Cancel
              </button>
              {step === "time" && selectedTime && (
                <button
                  onClick={() => setStep("details")}
                  className="ui-btn ui-btn-primary"
                >
                  Continue
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface SessionCardProps {
  session: ScheduledSession;
  isParent?: boolean;
  onUpdate?: (session: ScheduledSession) => void;
  onCancel?: (sessionId: string) => void;
  onComplete?: (session: ScheduledSession) => void;
}

export function SessionCard({ session, isParent, onUpdate, onCancel, onComplete }: SessionCardProps) {
  const scheduledDate = new Date(session.scheduledAt);
  const isPast = scheduledDate < new Date();
  const isUpcoming = !isPast && session.status === 'SCHEDULED';

  const getStatusColor = () => {
    switch (session.status) {
      case 'SCHEDULED': return isUpcoming ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500';
      case 'COMPLETED': return 'bg-green-500/10 text-green-500';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500';
      case 'NO_SHOW': return 'bg-gray-500/10 text-gray-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  const getStatusIcon = () => {
    switch (session.status) {
      case 'SCHEDULED': return '📅';
      case 'COMPLETED': return '✅';
      case 'CANCELLED': return '❌';
      case 'NO_SHOW': return '🚫';
      default: return '📅';
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--card)]">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-lg flex items-center justify-center text-2xl ${getStatusColor()}`}>
            {getStatusIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
                {session.status}
              </span>
              {session.parentAttended && session.tutorAttended && (
                <span className="text-green-500 text-xs">✓ Both attended</span>
              )}
            </div>
            <div className="text-lg font-bold mt-1">
              {scheduledDate.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric' 
              })}
            </div>
            <div className="text-sm text-[var(--foreground)]/60">
              {scheduledDate.toLocaleTimeString('en-US', { 
                hour: '2-digit', 
                minute: '2-digit' 
              })} • {session.durationMinutes} min
            </div>
          </div>
        </div>
      </div>

      {/* Meeting Details */}
      {(session.meetingLink || session.locationText) && (
        <div className="space-y-2 mb-3">
          {session.meetingLink && (
            <a
              href={session.meetingLink}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-sm text-[var(--accent)] hover:underline"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
              </svg>
              Join Online Session
            </a>
          )}
          {session.locationText && (
            <div className="flex items-center gap-2 text-sm text-[var(--foreground)]/60">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                <circle cx="12" cy="10" r="3"></circle>
              </svg>
              {session.locationText}
            </div>
          )}
        </div>
      )}

      {/* Notes */}
      {session.notes && (
        <div className="bg-[var(--muted)]/50 rounded-lg p-3 mb-3">
          <p className="text-xs text-[var(--foreground)]/60 mb-1">Notes:</p>
          <p className="text-sm">{session.notes}</p>
        </div>
      )}

      {/* Actions */}
      {isUpcoming && (
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => onUpdate?.(session)}
            className="ui-btn ui-btn-secondary text-xs h-8"
          >
            Reschedule
          </button>
          <button
            onClick={() => onCancel?.(session.id)}
            className="ui-btn ui-btn-ghost text-xs h-8 text-red-500"
          >
            Cancel
          </button>
          <button
            onClick={() => onComplete?.(session)}
            className="ui-btn ui-btn-primary text-xs h-8 ml-auto"
          >
            Mark Complete
          </button>
        </div>
      )}

      {/* Attendance info for completed sessions */}
      {session.status === 'COMPLETED' && (
        <div className="mt-3 flex gap-4 text-sm">
          <span className={session.parentAttended ? 'text-green-600' : 'text-red-500'}>
            {session.parentAttended ? '✓' : '✗'} Parent attended
          </span>
          <span className={session.tutorAttended ? 'text-green-600' : 'text-red-500'}>
            {session.tutorAttended ? '✓' : '✗'} Tutor attended
          </span>
        </div>
      )}
    </div>
  );
}

interface SessionCompleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  session: ScheduledSession;
  onSuccess?: () => void;
}

export function SessionCompleteModal({
  isOpen,
  onClose,
  session,
  onSuccess,
}: SessionCompleteModalProps) {
  const { auth } = useAuth();
  const { completeSession } = useContractSessions(session.contractId);
  const [parentAttended, setParentAttended] = useState<boolean>(true);
  const [tutorAttended, setTutorAttended] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>(session.notes || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const result = await completeSession(session.id, parentAttended, tutorAttended, notes);

    if (result) {
      onSuccess?.();
      onClose();
    } else {
      setError("Failed to complete session. Please try again.");
    }

    setIsLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      
      <div className="relative w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-xl animate-scale-in">
        <div className="p-6">
          <h2 className="text-xl font-semibold mb-2">Complete Session</h2>
          <p className="text-sm text-[var(--foreground)]/60 mb-4">
            Record attendance and notes for this session
          </p>

          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
                <span className="text-sm font-medium">Parent/Student attended</span>
                <button
                  type="button"
                  onClick={() => setParentAttended(!parentAttended)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    parentAttended ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${
                    parentAttended ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-3 border border-[var(--border)] rounded-lg">
                <span className="text-sm font-medium">Tutor attended</span>
                <button
                  type="button"
                  onClick={() => setTutorAttended(!tutorAttended)}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    tutorAttended ? 'bg-green-500' : 'bg-gray-300'
                  }`}
                >
                  <span className={`block w-5 h-5 bg-white rounded-full transition-transform ${
                    tutorAttended ? 'translate-x-6' : 'translate-x-0.5'
                  }`} />
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Session Notes
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="What was covered? Progress made? Homework assigned?"
                  className="w-full min-h-[100px] border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm resize-none"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="ui-btn ui-btn-ghost"
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="ui-btn ui-btn-primary"
                disabled={isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    Saving...
                  </span>
                ) : (
                  "Complete Session"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
