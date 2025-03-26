import { Ollama } from 'ollama'
import OpenAI from 'openai'
import { MODEL_PROVIDER, TEXT_MODEL, EMBEDDING_MODEL } from './config.js'
import dotenv from 'dotenv'

dotenv.config()

let client
export function initializeModelClient() {
  if (MODEL_PROVIDER === 'openai') {
    const apiKey = process.env.OPENAI_API_KEY || ''
    const baseURL = process.env.OPENAI_BASE_URL || ''
    client = new OpenAI({
      apiKey,
      baseURL,
    })
  } else {
    client = new Ollama({ host: 'http://localhost:11434' })
  }
}

export async function getEmbeddings(text) {
  if (MODEL_PROVIDER === 'openai') {
    const embedding = await client.embeddings.create({
      model: EMBEDDING_MODEL,
      input: text,
    })
    return embedding.data[0].embedding
  } else {
    const response = await client.embeddings({
      model,
      prompt: text,
    })
    return response.embedding
  }
}

export async function generateResponse(query, context) {
  const systemPromt = `
    You are a helpful AI agent specialized as customer service representative for LuminSphere with the following information:
    ${context}
    
    Your task is to answer the question based on the information above.

    Consider the following while generating a response:
    - Be polite, helpful, and professional. You are never supposed to be rude, unhelpful, unprofessional, or angry.
    - Provide accurate information, use complete sentences, proper grammar, punctuation, and spelling.
    - Be precise and to the point, response concisely, avoid unnecessary information, and use simple language.
    - Don't provide too much information, only answer the question asked. If the user provides a simple greeting, respond with a short greeting and ask how you can help.
      Example 1:
      User: "Hi"
      AI: "Hello!, How can I help you today?"

      Example 2:
      User: "What is LuminSphere?"
      AI: "The LuminSphere is a smart lighting orb that adjusts light, sound, and scent to enhance 
      your mood, focus, or relaxation."
    - When asked questions like "How do I contact support?", "Contact email", "Phone Number", or any other contact medium  provide only the relevant contact information based on the available support details. Include methods like email, phone, or other channels as applicable, using the specific contact information provided to you or configured for the system. Do not include additional assumptions, explanations, or unrelated information beyond the contact details unless explicitly requested by the user.
      Example 1:
      User: "How do I contact support?"
      AI: "You can contact support by emailing support@example.com or calling 1-800-123-4567."
      Example 2:
      User: "Contact email"
      AI: "The contact email is support@example.com."    
    - In situations where you believe you can't answer their question ask them to reach out to support@luminsphere.com or 1-800-586-4601'.
    - If the question is not related to LuminSphere, politely ignore the question and state that you are a LuminSphere AI agent and ask the user if they have any other questions related to LuminSphere.'
  `
  try {
    if (MODEL_PROVIDER === 'openai') {
      const completion = await client.chat.completions.create({
        model: TEXT_MODEL,
        stream: true,
        messages: [
          { role: 'system', content: systemPromt },
          {
            role: 'user',
            content: query,
          },
        ],
      })

      process.stdout.setDefaultEncoding('utf8')
      let fullResponse = ''
      for await (const chunk of completion) {
        const content = chunk.choices[0]?.delta?.content || ''
        process.stdout.write(content)
        fullResponse += content
      }

      process.stdout.write('\n')
      return fullResponse
    } else {
      const fullPrompt = `${systemPromt}\n Question: ${query}`
      const response = await client.generate({
        model,
        prompt: `${fullPrompt}`,
        stream: true,
      })

      let fullResponse = ''
      for await (const chunk of response) {
        process.stdout.write(chunk.response)
        fullResponse += chunk.response
      }

      process.stdout.write('\n')
      return fullResponse
    }
  } catch (error) {
    console.error('Error generating response:', error)
    return `Error: ${error.message}`
  }
}
