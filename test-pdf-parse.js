// Polyfill DOMMatrix for pdfjs-dist in Node.js
// @ts-ignore
global.DOMMatrix = require('canvas').DOMMatrix;
const fs = require('fs');
const pdfjsLib = require('pdfjs-dist');

const filePath = './product-documents/4e2e735b-26bd-4a5c-b04c-363ba0c77f80.pdf';

async function extractTextFromPdfBuffer(buffer) {
  const uint8Array = new Uint8Array(buffer);
  const loadingTask = pdfjsLib.getDocument({ data: uint8Array });
  const pdf = await loadingTask.promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map(item => item.str).join(' ') + '\n';
  }
  return text;
}

fs.readFile(filePath, async (err, data) => {
  if (err) {
    console.error('File read error:', err);
    return;
  }
  try {
    const text = await extractTextFromPdfBuffer(data);
    console.log('PDF text:', text.substring(0, 500));
  } catch (e) {
    console.error('pdfjs-dist error:', e);
  }
}); 