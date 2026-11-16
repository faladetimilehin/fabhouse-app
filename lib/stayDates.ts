export const DAY_MS = 86_400_000;

export function parseStayDate(value: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const date = new Date(`${value}T00:00:00.000Z`);
  return date.toISOString().slice(0, 10) === value ? date : null;
}

export function listStayNights(checkIn: Date, checkOut: Date): Date[] {
  const nights: Date[] = [];
  for (let day = checkIn.getTime(); day < checkOut.getTime(); day += DAY_MS) nights.push(new Date(day));
  return nights;
}

export function validStayRange(checkIn: Date, checkOut: Date, maxNights = 60) {
  const today = new Date();
  today.setUTCHours(0, 0, 0, 0);
  const nights = (checkOut.getTime() - checkIn.getTime()) / DAY_MS;
  return checkIn >= today && nights >= 1 && nights <= maxNights;
}
