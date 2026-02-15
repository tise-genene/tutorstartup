"use client";

import { useState, useEffect } from "react";
import { useInterviews, useTutorAvailability } from "../../hooks/useInterviews";
import { useAuth } from "../../app/providers";
import type { Interview } from "../../lib/types";

interface InterviewSchedulerModalProps {
  isOpen: boolean;
  onClose: () => void;
  proposalId: string;
  tutorId: string;
  tutorName: string;
  jobPostId: string;
  jobTitle: string;
  existingInterview?: Interview | null;
  onSuccess?: (interview: Interview) => void;
}

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const DURATION_OPTIONS = [15, 30, 45, 60];

export function InterviewSchedulerModal({
  isOpen,
  onClose,
  proposalId,
  tutorId,
  tutorName,
  jobPostId,
  jobTitle,
  existingInterview,
  onSuccess,
}: InterviewSchedulerModalProps) {
  const { auth } = useAuth();
  const { createInterview, updateInterview } = useInterviews(auth?.user.id || null);
  const { availability, getAvailableSlots } = useTutorAvailability(tutorId);
  
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [duration, setDuration] = useState<number>(30);
  const [meetingLink, setMeetingLink] = useState<string>("");
  const [meetingProvider, setMeetingProvider] = useState<string>("manual");
  const [notes, setNotes] = useState<string>("");
  const [availableSlots, setAvailableSlots] = useState<Array<{ startTime: string; endTime: string; isAvailable: boolean }>>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [step, setStep] = useState<"date" | "time" | "details">("date");

  // Set initial values if editing existing interview
  useEffect(() => {
    if (existingInterview) {
      const date = new Date(existingInterview.scheduledAt);
      setSelectedDate(date.toISOString().split('T')[0]);
      setSelectedTime(date.toTimeString().slice(0, 5));
      setDuration(existingInterview.durationMinutes);
      setMeetingLink(existingInterview.meetingLink || "");
      setMeetingProvider(existingInterview.meetingProvider);
      setNotes(existingInterview.notes || "");
    }
  }, [existingInterview]);

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
    if (existingInterview) {
      result = await updateInterview(existingInterview.id, {
        scheduledAt,
        durationMinutes: duration,
        meetingLink: meetingLink || undefined,
        meetingProvider: meetingProvider as any,
        notes: notes || undefined,
      });
    } else {
      result = await createInterview({
        proposalId,
        jobPostId,
        tutorId,
        scheduledAt,
        durationMinutes: duration,
        meetingLink: meetingLink || undefined,
        meetingProvider: meetingProvider as any,
        notes: notes || undefined,
      });
    }

    if (result) {
      onSuccess?.(result);
      onClose();
    } else {
      setError("Failed to schedule interview. Please try again.");
    }

    setIsLoading(false);
  };

  // Generate next 14 days
  const getNext14Days = () => {
    const days = [];
    const today = new Date();
    for (let i = 0; i < 14; i++) {
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

  const next14Days = getNext14Days();

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
                {existingInterview ? "Reschedule Interview" : "Schedule Interview"}
              </h2>
              <p className="text-sm text-[var(--foreground)]/60 mt-1">
                with {tutorName} for {jobTitle}
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
            <h3 className="text-sm font-medium mb-3">1. Select a Date</h3>
            <div className="grid grid-cols-7 gap-2">
              {next14Days.map((day) => (
                <button
                  key={day.date}
                  onClick={() => handleDateSelect(day.date)}
                  className={`flex flex-col items-center p-3 rounded-lg border transition-colors ${
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
          {step === "time" || step === "details" ? (
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
                  No available slots for this date. Please select another date.
                </div>
              )}
            </div>
          ) : null}

          {/* Step 3: Meeting Details */}
          {step === "details" && (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Meeting Link (optional)
                </label>
                <div className="flex gap-2">
                  <select
                    value={meetingProvider}
                    onChange={(e) => setMeetingProvider(e.target.value)}
                    className="border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm"
                  >
                    <option value="manual">Manual/Other</option>
                    <option value="zoom">Zoom</option>
                    <option value="google_meet">Google Meet</option>
                    <option value="teams">Microsoft Teams</option>
                  </select>
                  <input
                    type="url"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Notes (optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Add any notes about the interview..."
                  className="w-full border border-[var(--border)] rounded-lg px-3 py-2 bg-[var(--input)] text-sm resize-none"
                  rows={3}
                />
              </div>

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
                  ) : existingInterview ? (
                    "Update Interview"
                  ) : (
                    "Schedule Interview"
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

interface InterviewCardProps {
  interview: Interview;
  isClient?: boolean;
  onUpdate?: (interview: Interview) => void;
  onCancel?: (interviewId: string) => void;
  onComplete?: (interview: Interview) => void;
}

export function InterviewCard({ interview, isClient, onUpdate, onCancel, onComplete }: InterviewCardProps) {
  const scheduledDate = new Date(interview.scheduledAt);
  const isPast = scheduledDate < new Date();
  const isUpcoming = !isPast && interview.status === 'SCHEDULED';

  const getStatusColor = () => {
    switch (interview.status) {
      case 'SCHEDULED': return isUpcoming ? 'bg-blue-500/10 text-blue-500' : 'bg-yellow-500/10 text-yellow-500';
      case 'COMPLETED': return 'bg-green-500/10 text-green-500';
      case 'CANCELLED': return 'bg-red-500/10 text-red-500';
      case 'NO_SHOW': return 'bg-gray-500/10 text-gray-500';
      case 'RESCHEDULED': return 'bg-purple-500/10 text-purple-500';
      default: return 'bg-gray-500/10 text-gray-500';
    }
  };

  return (
    <div className="rounded-xl border border-[var(--border)] p-4 bg-[var(--card)]">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
              {interview.status}
            </span>
            {interview.rating && (
              <span className="text-yellow-500 text-sm">
                {"★".repeat(interview.rating)}{"☆".repeat(5 - interview.rating)}
              </span>
            )}
          </div>
          <h4 className="font-semibold">{interview.jobPost?.title}</h4>
          <p className="text-sm text-[var(--foreground)]/60">
            {isClient ? `With: ${interview.tutor?.name}` : `Client: ${interview.parent?.name}`}
          </p>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold">
            {scheduledDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
          </div>
          <div className="text-sm text-[var(--foreground)]/60">
            {scheduledDate.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
          </div>
          <div className="text-xs text-[var(--foreground)]/40">
            {interview.durationMinutes} min
          </div>
        </div>
      </div>

      {interview.meetingLink && (
        <a
          href={interview.meetingLink}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm text-[var(--accent)] hover:underline mb-3"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
          </svg>
          Join Meeting
        </a>
      )}

      {interview.notes && (
        <p className="text-sm text-[var(--foreground)]/60 mb-3">
          {interview.notes}
        </p>
      )}

      {interview.feedback && (
        <div className="bg-[var(--muted)]/50 rounded-lg p-3 mb-3">
          <p className="text-xs text-[var(--foreground)]/60 mb-1">Feedback:</p>
          <p className="text-sm">{interview.feedback}</p>
        </div>
      )}

      {/* Actions */}
      {isUpcoming && (
        <div className="flex gap-2 mt-3">
          {isClient && (
            <>
              <button
                onClick={() => onUpdate?.(interview)}
                className="ui-btn ui-btn-secondary text-xs h-8"
              >
                Reschedule
              </button>
              <button
                onClick={() => onCancel?.(interview.id)}
                className="ui-btn ui-btn-ghost text-xs h-8 text-red-500"
              >
                Cancel
              </button>
            </>
          )}
          <button
            onClick={() => onComplete?.(interview)}
            className="ui-btn ui-btn-primary text-xs h-8 ml-auto"
          >
            Mark Complete
          </button>
        </div>
      )}
    </div>
  );
}
