/**
 * Parses the raw content of the agent-conversation.log file
 * @param {string} logContent - The raw string content of the log file
 * @returns {Array<Object>} Array of parsed log entry objects
 */
export function parseLogEntries(logContent) {
  if (!logContent) return [];

  // Split by the separator defined in the log format
  const rawEntries = logContent.split('---\n').filter(e => e.trim());

  return rawEntries
    .map(raw => {
      const lines = raw.trim().split('\n');
      const entry = {};

      lines.forEach(line => {
        if (line.includes('Actor:')) {
          entry.agent = line.split('Actor:')[1].trim();
        } else if (line.includes('Type:')) {
          entry.type = line.split('Type:')[1].trim();
        } else if (line.includes('Task:')) {
          entry.task = line.split('Task:')[1].trim();
        } else if (line.includes('Content:')) {
          entry.content = line.split('Content:')[1].trim();
        } else if (line.includes('AST')) {
          entry.timestamp = line.replace(' AST', '').trim();
        }
      });

      return entry;
    })
    // Filter out incomplete entries that might occur during file writes
    .filter(e => e.agent && e.content);
}