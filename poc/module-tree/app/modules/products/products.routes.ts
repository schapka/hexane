/**
 * Products Routes
 */

import { defineEventHandler } from 'h3'
import { defineRoute } from '../../../core'

// Simple in-memory store for POC
const products = [
  { id: '1', name: 'Laptop', price: 999 },
  { id: '2', name: 'Mouse', price: 29 },
  { id: '3', name: 'Keyboard', price: 79 },
]

// GET /products - List all products
export const listProducts = defineRoute('GET', '/api/products', defineEventHandler((event) => {
  return {
    success: true,
    data: products,
  }
}))

// GET /products/:id - Get product by ID
export const getProduct = defineRoute('GET', '/api/products/:id', defineEventHandler((event) => {
  const id = event.context.params?.id
  const product = products.find(p => p.id === id)

  if (!product) {
    return {
      success: false,
      error: 'Product not found',
    }
  }

  return {
    success: true,
    data: product,
  }
}))
