import fs from 'fs/promises'
import path from 'path'
import { connect } from '@lancedb/lancedb'
import { RecursiveCharacterTextSplitter } from '@langchain/textsplitters'
import { getEmbeddings, initializeModelClient } from './modelClient.js'
import { processFile } from './utils.js'

initializeModelClient()

const splitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
})

async function ingestKnowledgeBase() {
  const dir = './knowledge-base'
  const files = await fs.readdir(dir)

  const dbPath = path.resolve('./db')
  const db = await connect(dbPath)

  const dummyPrompt = 'This is a dummy text to get the embeddings.'
  const embedding = await getEmbeddings(dummyPrompt)

  const table = await db.createTable(
    'knowledge_vectors',
    [{ vector: embedding, text: dummyPrompt, source: 'dummy.json' }],
    { writeMode: 'overwrite' }
  )

  console.log('Files to ingest:', files)
  for (const file of files) {
    console.log('Processing file:', file)
    const filePath = path.join(dir, file)
    const text = await processFile(filePath)
    console.log('Processed text', text)
    if (text) {
      const chunks = await splitter.splitText(text)
      for (const chunk of chunks) {
        const embedding = await getEmbeddings(chunk)
        await table.add([{ vector: embedding, text: chunk, source: file }])
      }
    }
  }
  console.log('Knowledge base ingested into vector database.')
}

ingestKnowledgeBase().catch(console.error)
