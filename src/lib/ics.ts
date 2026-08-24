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

/** RFC 5545 requires CRLF line endings and folding at 75 octets. */
function fold(line: string): string {
  const escaped = line.replace(/\r?\n/g, '\\n');
  if (escaped.length <= 73) return escaped;
  const parts: string[] = [];
  let rest = escaped;
  parts.push(rest.slice(0, 73));
  rest = rest.slice(73);
  while (rest.length) {
    parts.push(' ' + rest.slice(0, 72));
    rest = rest.slice(72);
  }
  return parts.join('\r\n');
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
