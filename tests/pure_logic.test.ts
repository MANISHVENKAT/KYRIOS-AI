import test from 'node:test';
import assert from 'node:assert/strict';
import { RagService } from '../src/services/rag.ts';

test('RagService: chunkText splits text into overlapping chunks', () => {
  const sampleWords = Array.from({ length: 600 }, (_, i) => `word${i}`).join(' ');
  const chunks = RagService.chunkText(sampleWords, 200, 30);
  assert.ok(chunks.length > 2, `Expected > 2 chunks, got ${chunks.length}`);
  assert.ok(chunks[0].includes('word0'));
});

test('RagService: retrieveRelevantChunks finds matches and ranks by score', () => {
  const docs = [
    {
      id: 'doc-1',
      name: 'architecture.md',
      size: 500,
      mimeType: 'text/markdown',
      text: 'PostgreSQL database with pgvector and secure indexing for KYRIOS AI.',
      chunks: ['PostgreSQL database with pgvector and secure indexing for KYRIOS AI.'],
      uploadedAt: new Date().toISOString()
    },
    {
      id: 'doc-2',
      name: 'recipes.txt',
      size: 200,
      mimeType: 'text/plain',
      text: 'Chocolate chip cookies recipe with butter and sugar.',
      chunks: ['Chocolate chip cookies recipe with butter and sugar.'],
      uploadedAt: new Date().toISOString()
    }
  ];

  const results = RagService.retrieveRelevantChunks('pgvector indexing database', docs, 2);
  assert.strictEqual(results.length, 1);
  assert.strictEqual(results[0].documentTitle, 'architecture.md');
  assert.ok(results[0].score > 0);
});

test('Speech cleanup: strips markdown and code blocks for spoken delivery', () => {
  const rawMarkdown = `
# Welcome to KYRIOS!
Here is the code you requested:
\`\`\`ts
const x = 42;
console.log(x);
\`\`\`
Check out https://example.com for **more details**.
- Item 1
- Item 2
`;
  const cleaned = rawMarkdown
    .replace(/```[\s\S]*?```/g, ' Code snippet omitted. ')
    .replace(/`([^`]+)`/g, '$1')
    .replace(/https?:\/\/\S+/g, 'link')
    .replace(/#+\s*/g, '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/^\s*[-*+]\s+/gm, '')
    .replace(/^\s*>\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();

  assert.ok(!cleaned.includes('console.log'), 'Should not contain raw code block');
  assert.ok(!cleaned.includes('https://'), 'Should not contain raw URLs');
  assert.ok(cleaned.includes('Code snippet omitted'));
  assert.ok(cleaned.includes('more details'));
});

test('ResilienceService: generates comprehensive answer and action cards on 405 fallback', async () => {
  const { ResilienceService } = await import('../src/services/resilience.ts');
  const dummyMode = {
    id: 'coder',
    name: 'Staff Engineer',
    tagline: 'Technical excellence',
    icon: 'Terminal',
    systemPrompt: 'Code cleanly'
  };

  // Test code scaffold query
  const codeResult = ResilienceService.generateAnswer(
    'Scaffold a production full-stack project structure',
    dummyMode as any,
    'Alex',
    [],
    []
  );
  assert.ok(codeResult.content.includes('project-root/'));
  assert.ok(codeResult.actions.length > 0);
  assert.strictEqual(codeResult.actions[0].type, 'code_scaffold');

  // Test document vault query with grounded chunk
  const docResult = ResilienceService.generateAnswer(
    'What does the quarterly report state?',
    dummyMode as any,
    'Alex',
    [{ documentTitle: 'report.pdf', chunkText: 'Q3 revenue surged by 34% driven by cloud growth.' }],
    []
  );
  assert.ok(docResult.content.includes('report.pdf'));
  assert.ok(docResult.content.includes('Q3 revenue surged'));
  assert.strictEqual(docResult.citations.length, 1);
});
