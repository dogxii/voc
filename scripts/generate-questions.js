import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sourcePath = path.join(__dirname, '../原题.txt');
const outputPath = path.join(__dirname, '../src/lib/questions.json');

function normalizeText(text) {
  return text
    .replace(/\u2028/g, '\n')
    .replace(/\r\n?/g, '\n')
    .replace(/\u00a0/g, ' ');
}

function assertSectionReady(unit, section, line) {
  if (!unit || !section) {
    throw new Error(`Question found before unit/section: ${line}`);
  }
}

function parseQuestions(text) {
  const questions = [];
  const lines = normalizeText(text)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);

  let currentUnit = null;
  let currentSection = null;
  let currentQ = null;

  function pushCurrent() {
    if (!currentQ) return;

    const optionCount = Object.keys(currentQ.options).length;
    if (optionCount !== 4) {
      throw new Error(
        `${currentQ.id} expected 4 options, found ${optionCount}`,
      );
    }
    if (!currentQ.answer) {
      throw new Error(`${currentQ.id} is missing an answer`);
    }
    if (!currentQ.options[currentQ.answer]) {
      throw new Error(`${currentQ.id} answer does not match an option`);
    }

    questions.push(currentQ);
    currentQ = null;
  }

  for (const line of lines) {
    const unitMatch = line.match(/^Unit\s+(\d+)$/i);
    if (unitMatch) {
      pushCurrent();
      currentUnit = Number(unitMatch[1]);
      currentSection = null;
      continue;
    }

    if (/^Quiz$/i.test(line)) {
      pushCurrent();
      currentSection = 'quiz';
      continue;
    }

    if (/^(?:Unit\s+)?Test$/i.test(line)) {
      pushCurrent();
      currentSection = 'test';
      continue;
    }

    const questionMatch = line.match(/^(\d+)\.\s*(.+)$/);
    if (questionMatch) {
      pushCurrent();
      assertSectionReady(currentUnit, currentSection, line);

      currentQ = {
        id: `u${currentUnit}_${currentSection}_${questionMatch[1]}`,
        unitId: `unit${currentUnit}`,
        section: currentSection,
        question: questionMatch[2],
        options: {},
        rawOptions: [],
        answer: null,
      };
      continue;
    }

    const optionMatch = line.match(/^([ABCD])\s+(.+)$/);
    if (optionMatch) {
      if (!currentQ) {
        throw new Error(`Option found before question: ${line}`);
      }
      currentQ.options[optionMatch[1]] = optionMatch[2];
      continue;
    }

    const answerMatch = line.match(/^正确答案[:：]\s*([ABCD])$/);
    if (answerMatch) {
      if (!currentQ) {
        throw new Error(`Answer found before question: ${line}`);
      }
      currentQ.answer = answerMatch[1];
      continue;
    }

    if (currentQ && Object.keys(currentQ.options).length === 0) {
      currentQ.question = `${currentQ.question} ${line}`;
      continue;
    }
  }

  pushCurrent();
  return questions;
}

const rawText = fs.readFileSync(sourcePath, 'utf-8');
const questions = parseQuestions(rawText);

fs.writeFileSync(outputPath, `${JSON.stringify(questions, null, '\t')}\n`);

const summary = questions.reduce((acc, question) => {
  const key = `${question.unitId} ${question.section}`;
  acc[key] = (acc[key] ?? 0) + 1;
  return acc;
}, {});

console.log(`Generated ${questions.length} questions to ${outputPath}`);
Object.entries(summary).forEach(([key, count]) => {
  console.log(`${key}: ${count}`);
});
