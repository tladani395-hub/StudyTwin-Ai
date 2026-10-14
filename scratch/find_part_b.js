const fs = require('fs');
const readline = require('readline');

async function findPartB() {
  const fileStream = fs.createReadStream('C:\\Users\\Tirth\\.gemini\\antigravity\\brain\\b57d341f-3178-41ff-865e-6f1f32d21ba5\\.system_generated\\logs\\transcript_full.jsonl');
  const rl = readline.createInterface({ input: fileStream, crlfDelay: Infinity });

  for await (const line of rl) {
    if (line.includes('PART B:')) {
      const idx = line.indexOf('PART B:');
      const partBText = line.substring(idx, idx + 2500);
      console.log(partBText);
      break;
    }
  }
}
findPartB();
