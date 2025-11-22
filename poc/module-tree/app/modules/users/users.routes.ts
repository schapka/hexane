/**
 * Users Routes
 */

import { defineEventHandler } from 'h3'
import { defineRoute } from '../../../core'

// Simple in-memory store for POC
const users = [
  { id: '1', name: 'Alice', email: 'alice@example.com' },
  { id: '2', name: 'Bob', email: 'bob@example.com' },
]

// GET /users - List all users
export const listUsers = defineRoute('GET', '/api/users', defineEventHandler((event) => {
  return {
    success: true,
    data: users,
  }
}))

// GET /users/:id - Get user by ID
export const getUser = defineRoute('GET', '/api/users/:id', defineEventHandler((event) => {
  const id = event.context.params?.id
  const user = users.find(u => u.id === id)

  if (!user) {
    return {
      success: false,
      error: 'User not found',
    }
  }

  return {
    success: true,
    data: user,
  }
}))

// POST /users - Create user (simplified)
export const createUser = defineRoute('POST', '/api/users', defineEventHandler(async (event) => {
  // In real app, would use body extractor with schema validation
  const body = await readBody(event) as { name: string; email: string }

  const newUser = {
    id: String(users.length + 1),
    name: body.name,
    email: body.email,
  }

  users.push(newUser)

  return {
    success: true,
    data: newUser,
  }
}))

async function readBody(event: any) {
  // Simple body reading for POC
  return new Promise((resolve) => {
    let body = ''
    event.node.req.on('data', (chunk: any) => {
      body += chunk.toString()
    })
    event.node.req.on('end', () => {
      try {
        resolve(JSON.parse(body))
      } catch {
        resolve({})
      }
    })
  })
}
