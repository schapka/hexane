/**
 * Products Service
 */

export class ProductService {
  findAll() {
    console.log('[ProductService] findAll called')
    return []
  }

  findById(id: string) {
    console.log(`[ProductService] findById called with id: ${id}`)
    return null
  }
}
