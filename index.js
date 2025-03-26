import readline from 'readline'
import path from 'path'

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
})
import { connect } from '@lancedb/lancedb'
import {
  getEmbeddings,
  generateResponse,
  initializeModelClient,
} from './modelClient.js'

initializeModelClient()

async function processQuery(query) {
  const dbPath = path.resolve('./db')
  const db = await connect(dbPath)

  const table = await db.openTable('knowledge_vectors')
  const queryEmbedding = await getEmbeddings(query)
  const results = await table.vectorSearch(queryEmbedding).limit(2).toArray()
  const context = results.map((r) => r.text).join('\n\n')
  return await generateResponse(query, context)
}

function askQuestion() {
  rl.question('Enter your query (or "exit" to quit): ', async (query) => {
    if (query.toLowerCase() === 'exit') {
      rl.close()
      return
    }
    try {
      await processQuery(query)
    } catch (error) {
      console.error('Error:', error)
    }
    askQuestion()
  })
}

askQuestion()
