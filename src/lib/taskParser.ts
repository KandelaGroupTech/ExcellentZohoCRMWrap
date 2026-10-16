export interface TaskParsed {
  text: string;
  initials: string[];
}

export function parseTaskSubject(subject: string): TaskParsed {
  if (!subject) return { text: '', initials: [] };

  const initialsFound = new Set<string>();

  // 1. Check for legacy trailing format: " - XX"
  const dashMatch = subject.match(/ - ([A-Z]{2,3})$/i);
  if (dashMatch) {
    initialsFound.add(dashMatch[1].toUpperCase());
  }

  // 2. Check for @XX or @Name mentions using regex exec loop (compatible with all TS targets)
  const atRegex = /@([A-Za-z0-9_]+)/g;
  let match: RegExpExecArray | null;
  while ((match = atRegex.exec(subject)) !== null) {
    if (match[1]) {
      initialsFound.add(match[1].toUpperCase());
    }
  }

  // Clean the text: strip trailing " - XX" for display
  let cleanText = subject;
  if (dashMatch) {
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
