import { promises as fs } from 'fs'
import { extname } from 'path'
import pdfParse from 'pdf-parse/lib/pdf-parse.js'
import csvParser from 'csv-parser'
import { createReadStream } from 'fs'
import tesseract from 'tesseract.js'
const { recognize } = tesseract

async function readTextFile(filePath) {
  return await fs.readFile(filePath, 'utf-8')
}

async function readCsvFile(filePath) {
  const rows = []
  await new Promise((resolve) => {
    createReadStream(filePath)
      .pipe(csvParser())
      .on('data', (row) => rows.push(Object.values(row).join(' ')))
      .on('end', resolve)
  })
  return rows.join('\n')
}

async function readPdfFile(filePath) {
  const dataBuffer = await fs.readFile(filePath)
  const data = await pdfParse(dataBuffer)
  return data.text
}

async function readImageFile(filePath) {
  const {
    data: { text },
  } = await recognize(filePath, 'eng')
  return text
}

export async function processFile(filePath) {
  const ext = extname(filePath).toLowerCase()
  if (ext === '.txt') return await readTextFile(filePath)
  if (ext === '.csv') return await readCsvFile(filePath)
  if (ext === '.pdf') return await readPdfFile(filePath)
  if (ext === '.png' || ext === '.jpg') return await readImageFile(filePath)
  return ''
}
