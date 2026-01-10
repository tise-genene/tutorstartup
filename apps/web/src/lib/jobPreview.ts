import type { GenderPreference, JobPayType } from "./types";

type JobPreviewInput = {
  location?: string | null;
  grade?: number | null;
  subjects?: string[] | null;
  sessionMinutes?: number | null;
  daysPerWeek?: number | null;
  startTime?: string | null;
  endTime?: string | null;
  preferredDays?: string[] | null;
  payType?: JobPayType | null;
  hourlyAmount?: number | null;
  monthlyAmount?: number | null;
  fixedAmount?: number | null;
  genderPreference?: GenderPreference | null;
  currency?: string | null;
};

function formatMinutes(value: number): string {
  const hours = Math.floor(value / 60);
  const minutes = value % 60;
  if (hours > 0 && minutes > 0) return `${hours}hr ${minutes}min`;
  if (hours > 0) return `${hours}hr`;
  return `${minutes}min`;
}

function titleCase(value: string): string {
  if (!value) return value;
  return value[0].toUpperCase() + value.slice(1).toLowerCase();
}

function formatPayType(value: JobPayType): string {
  if (value === "HOURLY") return "hourly";
  if (value === "MONTHLY") return "monthly";
  return "fixed";
}

function formatGenderPreference(value: GenderPreference): string {
  if (value === "MALE") return "male";
  if (value === "FEMALE") return "female";
  return "any";
}

export function formatJobPostPreview(job: JobPreviewInput): string {
  const lines: string[] = [];

  const location = job.location?.trim();
  if (location) lines.push(`✅ Place: ${location}`);

  if (job.grade != null) lines.push(`✅ Grade: ${job.grade}`);

  const subjects = (job.subjects ?? []).filter((s) => s.trim().length > 0);
  if (subjects.length > 0) lines.push(`✅ Subjects: ${subjects.join(" & ")}`);

  if (job.sessionMinutes != null && job.sessionMinutes > 0) {
    lines.push(`✅ Session: ${formatMinutes(job.sessionMinutes)}/day`);
  }

  if (job.daysPerWeek != null && job.daysPerWeek > 0) {
    const start = job.startTime?.trim();
    const end = job.endTime?.trim();
    if (start && end) {
      lines.push(
        `✅ Schedule: ${job.daysPerWeek} days/week Between ${start}-${end} local time`
      );
    } else {
      lines.push(`✅ Schedule: ${job.daysPerWeek} days/week`);
    }
  } else {
    const start = job.startTime?.trim();
    const end = job.endTime?.trim();
    if (start && end) {
      lines.push(`✅ Time window: Between ${start}-${end} local time`);
    }
  }

  if (job.payType) {
    const currency = (job.currency ?? "ETB").trim() || "ETB";
    let amount: number | null = null;
    if (job.payType === "HOURLY") amount = job.hourlyAmount ?? null;
    if (job.payType === "MONTHLY") amount = job.monthlyAmount ?? null;
    if (job.payType === "FIXED") amount = job.fixedAmount ?? null;

    const typeLabel = formatPayType(job.payType);
    if (amount != null) {
      lines.push(`✅ Pay type: ${typeLabel} (${amount} ${currency})`);
    } else {
      lines.push(`✅ Pay type: ${typeLabel}`);
    }
  }

  if (job.genderPreference) {
    lines.push(
      `✅ Gender preference: ${formatGenderPreference(job.genderPreference)}`
    );
  }

  const preferredDays = (job.preferredDays ?? []).filter(
    (d) => d.trim().length > 0
  );
  if (preferredDays.length > 0) {
    lines.push(
      `✅ Preferred days: ${preferredDays.map((d) => titleCase(d)).join(", ")}`
    );
  }

  return lines.join("\n\n");
}
