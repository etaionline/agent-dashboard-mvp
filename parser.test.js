import { describe, it, expect } from 'vitest';
import { parseLogEntries } from '../utils/parser.js';

describe('Log Parser Utility', () => {
  it('should parse a single valid log entry', () => {
    const logContent = `01/09/2026, 02:48 AST
Actor: BLACKBOX-TEST
Type: test
Task: Unit Testing
Content: This is a test content.
---
`;
    const result = parseLogEntries(logContent);
    expect(result).toHaveLength(1);
    expect(result[0]).toEqual({
      timestamp: '01/09/2026, 02:48',
      agent: 'BLACKBOX-TEST',
      type: 'test',
      task: 'Unit Testing',
      content: 'This is a test content.'
    });
  });

  it('should handle multiple entries correctly', () => {
    const logContent = `01/09/2026, 02:48 AST
Actor: Agent A
Content: Content A
---
01/09/2026, 02:49 AST
Actor: Agent B
Content: Content B
---
`;
    const result = parseLogEntries(logContent);
    expect(result).toHaveLength(2);
    expect(result[0].agent).toBe('Agent A');
    expect(result[1].agent).toBe('Agent B');
  });

  it('should filter out incomplete entries', () => {
    const logContent = `01/09/2026, 02:48 AST
Type: test
---
Actor: Agent B
Content: Valid
---
`;
    const result = parseLogEntries(logContent);
    expect(result).toHaveLength(1);
    expect(result[0].agent).toBe('Agent B');
  });

  it('should handle empty or null input', () => {
    expect(parseLogEntries('')).toEqual([]);
    expect(parseLogEntries(null)).toEqual([]);
  });
});