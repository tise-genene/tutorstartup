"use client";

import { useState, useEffect } from "react";
import { PageShell } from "../../_components/PageShell";
import { useAuth, useI18n } from "../../providers";
import { useTutorAvailability } from "../../../hooks/useInterviews";
import type { TutorAvailability, CreateAvailabilityPayload } from "../../../lib/types";

const DAYS = [
  { id: 0, name: "Sunday", short: "Sun" },
  { id: 1, name: "Monday", short: "Mon" },
  { id: 2, name: "Tuesday", short: "Tue" },
  { id: 3, name: "Wednesday", short: "Wed" },
  { id: 4, name: "Thursday", short: "Thu" },
  { id: 5, name: "Friday", short: "Fri" },
  { id: 6, name: "Saturday", short: "Sat" },
];

const TIME_OPTIONS = [
  "06:00", "06:30", "07:00", "07:30", "08:00", "08:30", 
  "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
  "12:00", "12:30", "13:00", "13:30", "14:00", "14:30",
  "15:00", "15:30", "16:00", "16:30", "17:00", "17:30",
  "18:00", "18:30", "19:00", "19:30", "20:00", "20:30", "21:00"
];

function PlusIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="5" x2="12" y2="19"></line>
      <line x1="5" y1="12" x2="19" y2="12"></line>
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="3 6 5 6 21 6"></polyline>
      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
    </svg>
  );
}

function ClockIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"></circle>
      <polyline points="12 6 12 12 16 14"></polyline>
    </svg>
  );
}

interface TimeSlotEditorProps {
  dayId: number;
  dayName: string;
  existingSlots: TutorAvailability[];
  onAdd: (slot: CreateAvailabilityPayload) => void;
  onRemove: (id: string) => void;
  isLoading: boolean;
}

function TimeSlotEditor({ dayId, dayName, existingSlots, onAdd, onRemove, isLoading }: TimeSlotEditorProps) {
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("17:00");
  const [isAdding, setIsAdding] = useState(false);

  const daySlots = existingSlots
    .filter((slot: TutorAvailability) => slot.dayOfWeek === dayId)
    .sort((a: TutorAvailability, b: TutorAvailability) => a.startTime.localeCompare(b.startTime));

  const handleAdd = () => {
    if (startTime >= endTime) return;
    
    onAdd({
      dayOfWeek: dayId,
      startTime,
      endTime,
      isRecurring: true,
    });
    setIsAdding(false);
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  return (
    <div className="bg-[var(--card)] rounded-xl border border-[var(--border)] p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-[var(--accent)]/10 text-[var(--accent)] flex items-center justify-center text-sm font-bold">
            {dayName.slice(0, 3)}
          </span>
          {dayName}
        </h3>
        <button
          onClick={() => setIsAdding(!isAdding)}
          className="ui-btn ui-btn-ghost p-1.5 h-8 w-8"
          disabled={isLoading}
        >
          <PlusIcon />
        </button>
      </div>

      {/* Add New Slot Form */}
      {isAdding && (
        <div className="mb-4 p-3 bg-[var(--muted)]/50 rounded-lg space-y-3">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs text-[var(--foreground)]/60 block mb-1">Start</label>
              <select
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full border border-[var(--border)] rounded-md px-2 py-1.5 text-sm bg-[var(--input)]"
              >
                {TIME_OPTIONS.map(time => (
                  <option key={time} value={time}>{formatTime(time)}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-[var(--foreground)]/60 block mb-1">End</label>
              <select
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full border border-[var(--border)] rounded-md px-2 py-1.5 text-sm bg-[var(--input)]"
              >
                {TIME_OPTIONS.map(time => (
                  <option key={time} value={time}>{formatTime(time)}</option>
                ))}
              </select>
            </div>
          </div>
          {startTime >= endTime && (
            <p className="text-xs text-red-500">End time must be after start time</p>
          )}
          <div className="flex gap-2">
            <button
              onClick={() => setIsAdding(false)}
              className="flex-1 ui-btn ui-btn-ghost text-xs h-8"
            >
              Cancel
            </button>
            <button
              onClick={handleAdd}
              disabled={startTime >= endTime || isLoading}
              className="flex-1 ui-btn ui-btn-primary text-xs h-8"
            >
              Add Slot
            </button>
          </div>
        </div>
      )}

      {/* Existing Slots */}
      <div className="space-y-2">
        {daySlots.length === 0 ? (
          <p className="text-sm text-[var(--foreground)]/40 text-center py-4">
            No availability set
          </p>
        ) : (
          daySlots.map((slot: TutorAvailability) => (
            <div
              key={slot.id}
              className="flex items-center justify-between p-2 bg-[var(--accent)]/5 rounded-lg border border-[var(--accent)]/20"
            >
              <div className="flex items-center gap-2">
                <ClockIcon />
                <span className="text-sm font-medium">
                  {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </span>
              </div>
              <button
                onClick={() => onRemove(slot.id)}
                className="p-1.5 text-red-500 hover:bg-red-500/10 rounded-md transition-colors"
                disabled={isLoading}
              >
                <TrashIcon />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function TutorAvailabilityPage() {
  const { t } = useI18n();
  const { auth } = useAuth();
  const {
    availability,
    loading,
    error,
    addAvailability,
    removeAvailability,
    fetchAvailability,
  } = useTutorAvailability(auth?.user.id || null);

  const isTutor = auth?.user.role === "TUTOR";

  useEffect(() => {
    if (!auth) return;
    fetchAvailability();
  }, [auth, fetchAvailability]);

  const handleAddSlot = async (slot: CreateAvailabilityPayload) => {
    await addAvailability(slot);
  };

  const handleRemoveSlot = async (id: string) => {
    await removeAvailability(id);
  };

  if (!auth) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel p-8 text-center">
            <p className="text-[var(--foreground)]/60">{t("state.loginRequired")}</p>
          </div>
        </div>
      </PageShell>
    );
  }

  if (!isTutor) {
    return (
      <PageShell>
        <div className="mx-auto max-w-4xl">
          <div className="glass-panel p-8 text-center">
            <p className="text-[var(--foreground)]/60">This page is for tutors only.</p>
          </div>
        </div>
      </PageShell>
    );
  }

  // Calculate total available hours per week
  const totalHours = availability.reduce((total: number, slot: TutorAvailability) => {
    const start = new Date(`2000-01-01T${slot.startTime}`);
    const end = new Date(`2000-01-01T${slot.endTime}`);
    const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
    return total + hours;
  }, 0);

  // Count days with availability
  const daysWithAvailability = new Set(availability.map((a: TutorAvailability) => a.dayOfWeek)).size;

  return (
    <PageShell>
      <div className="mx-auto max-w-5xl">
        <div className="glass-panel p-8">
          {/* Header */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-semibold">My Availability</h1>
              <p className="mt-1 text-sm text-[var(--foreground)]/60">
                Set your weekly schedule so clients can book interviews with you
              </p>
            </div>
            <div className="flex gap-4 text-sm">
              <div className="text-center px-4 py-2 bg-[var(--accent)]/10 rounded-lg">
                <div className="text-2xl font-bold text-[var(--accent)]">{daysWithAvailability}</div>
                <div className="text-xs text-[var(--foreground)]/60">Days Available</div>
              </div>
              <div className="text-center px-4 py-2 bg-[var(--accent)]/10 rounded-lg">
                <div className="text-2xl font-bold text-[var(--accent)]">{totalHours.toFixed(1)}</div>
                <div className="text-xs text-[var(--foreground)]/60">Hours/Week</div>
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-lg bg-red-500/10 text-red-500 text-sm">
              {error}
            </div>
          )}

          {loading && availability.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--accent)]" />
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {DAYS.map(day => (
                <TimeSlotEditor
                  key={day.id}
                  dayId={day.id}
                  dayName={day.name}
                  existingSlots={availability}
                  onAdd={handleAddSlot}
                  onRemove={handleRemoveSlot}
                  isLoading={loading}
                />
              ))}
            </div>
          )}

          {/* Info Box */}
          <div className="mt-8 p-4 bg-blue-500/10 rounded-lg border border-blue-500/20">
            <h4 className="font-medium text-blue-600 mb-2 flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="16" x2="12" y2="12"/>
                <line x1="12" y1="8" x2="12.01" y2="8"/>
              </svg>
              How it works
            </h4>
            <ul className="text-sm text-[var(--foreground)]/70 space-y-1 ml-6 list-disc">
              <li>Add time slots for each day you're available for interviews</li>
              <li>Clients will only see these time slots when scheduling</li>
              <li>You'll receive interview requests for these times</li>
              <li>You can always reschedule if needed</li>
            </ul>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
