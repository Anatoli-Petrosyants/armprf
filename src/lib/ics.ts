import { site } from './site';

interface IcsEvent {
  uid: string;
  title: string;
  description: string;
  location: string;
  start: Date;
  end?: Date;
  url: string;
}

function stamp(date: Date, endOfDay = false): string {
  const d = new Date(date);
  if (endOfDay) d.setUTCDate(d.getUTCDate() + 1);
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/**
 * RFC 5545 folds at 75 *octets*, not characters. Armenian is three bytes per
 * letter in UTF-8, so counting characters would produce lines that overflow —
 * and splitting mid-sequence would corrupt them. Walk by code point, measure in
 * bytes, and never break inside one.
 */
function fold(line: string): string {
  const escaped = line.replace(/\r?\n/g, '\\n');
  const encoder = new TextEncoder();
  if (encoder.encode(escaped).length <= 75) return escaped;

  const parts: string[] = [];
  let current = '';
  let bytes = 0;
  let limit = 75;

  for (const char of escaped) {
    const size = encoder.encode(char).length;
    if (bytes + size > limit) {
      parts.push(current);
      current = '';
      bytes = 1; // the leading space on a continuation line counts
      limit = 75;
    }
    current += char;
    bytes += size;
  }
  if (current) parts.push(current);

  return parts.map((part, index) => (index === 0 ? part : ` ${part}`)).join('\r\n');
}

function escapeText(value: string): string {
  return value.replace(/[\;,]/g, (c) => `\\${c}`).replace(/\r?\n/g, '\\n');
}

/**
 * All-day VEVENT for a match. Matches are day-scoped, so DTSTART/DTEND use
 * VALUE=DATE and DTEND is exclusive.
 */
export function buildIcs(event: IcsEvent): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:-//${site.shortName}//${site.domain}//EN`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${event.uid}@${site.domain}`,
    `DTSTAMP:${stamp(event.start)}T000000Z`,
    `DTSTART;VALUE=DATE:${stamp(event.start)}`,
    `DTEND;VALUE=DATE:${stamp(event.end ?? event.start, true)}`,
    `SUMMARY:${escapeText(event.title)}`,
    `DESCRIPTION:${escapeText(event.description)}`,
    `LOCATION:${escapeText(event.location)}`,
    `URL:${event.url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  ];
  return lines.map(fold).join('\r\n') + '\r\n';
}
