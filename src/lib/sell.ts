import { createHash, randomInt } from "crypto";

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function generateVerificationCode() {
  return String(randomInt(100000, 999999));
}

export function hashVerificationCode(email: string, code: string) {
  return createHash("sha256").update(`${normalizeEmail(email)}:${code}`).digest("hex");
}

/** Generate mock appointment slots for the next ~10 business days. */
export function generateAppointmentSlots(countDays = 8) {
  const slots: { id: string; dateLabel: string; timeLabel: string; iso: string }[] = [];
  const times = ["09:00 AM", "10:00 AM", "11:00 AM", "01:00 PM", "02:00 PM", "03:00 PM", "04:00 PM"];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  cursor.setDate(cursor.getDate() + 1);

  let daysAdded = 0;
  while (daysAdded < countDays) {
    const day = cursor.getDay();
    if (day !== 0 && day !== 1) {
      const dateLabel = cursor.toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric"
      });
      for (const timeLabel of times) {
        const match = timeLabel.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
        if (!match) continue;
        let hour = Number(match[1]);
        const minute = Number(match[2]);
        const meridiem = match[3].toUpperCase();
        if (meridiem === "PM" && hour !== 12) hour += 12;
        if (meridiem === "AM" && hour === 12) hour = 0;
        const at = new Date(cursor);
        at.setHours(hour, minute, 0, 0);
        slots.push({
          id: at.toISOString(),
          dateLabel,
          timeLabel,
          iso: at.toISOString()
        });
      }
      daysAdded += 1;
    }
    cursor.setDate(cursor.getDate() + 1);
  }

  return slots;
}
