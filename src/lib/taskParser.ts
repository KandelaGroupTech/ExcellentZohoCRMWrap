export interface TaskParsed {
  text: string;
  initials: string[];
}

const STOP_WORDS = new Set([
  'IN', 'ON', 'AT', 'BY', 'TO', 'DO', 'NO', 'SO', 'IF', 'UP', 'MY', 'GO', 'HE', 'WE', 'IS', 'AM', 'AS', 'BE', 'AN', 'OR', 'OF', 'IT',
  'ALL', 'NEW', 'ADD', 'GET', 'SET', 'RUN', 'FIX', 'PAY', 'BUY', 'SEE', 'ASK', 'NOT', 'AND', 'FOR', 'BUT', 'OUT', 'OFF'
]);

export function parseTaskSubject(subject: string): TaskParsed {
  if (!subject) return { text: '', initials: [] };

  const initialsFound = new Set<string>();

  // 1. Check for legacy trailing format: " - XX"
  const dashMatch = subject.match(/ - ([A-Z]{2,3})$/i);
  if (dashMatch) {
    const code = dashMatch[1].toUpperCase();
    if (!STOP_WORDS.has(code)) {
      initialsFound.add(code);
    }
  }

  // 2. Check for leading initials format: "XX to ...", "XX: ...", "XX - ..."
  const leadingMatch = subject.match(/^([A-Z]{2,3})(?::|\s+to\b|\s*-)/i);
  if (leadingMatch) {
    const code = leadingMatch[1].toUpperCase();
    if (!STOP_WORDS.has(code)) {
      initialsFound.add(code);
    }
  }

  // 3. Check for @XX or @Name mentions using regex exec loop (compatible with all TS targets)
  const atRegex = /@([A-Za-z0-9_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = atRegex.exec(subject)) !== null) {
    if (match[1]) {
      const code = match[1].toUpperCase();
      if (!STOP_WORDS.has(code)) {
        initialsFound.add(code);
      }
    }
  }

  // Clean the text: strip trailing " - XX" for display
  let cleanText = subject;
  if (dashMatch && !STOP_WORDS.has(dashMatch[1].toUpperCase())) {
    cleanText = cleanText.replace(/ - [A-Z]{2,3}$/i, '').trim();
  }

  return {
    text: cleanText,
    initials: Array.from(initialsFound)
  };
}

export function isTaskForUser(subject: string, userInitials?: string): boolean {
  if (!userInitials) return false;
  const parsed = parseTaskSubject(subject);
  const target = userInitials.toUpperCase();
  return parsed.initials.includes(target);
}
