/**
 * Users Service
 *
 * Simple service to demonstrate provider pattern.
 * In real implementation, this would be injectable via DI.
 */

export class UserService {
  findAll() {
    console.log('[UserService] findAll called')
    return []
  }

  findById(id: string) {
    console.log(`[UserService] findById called with id: ${id}`)
    return null
  }

  create(data: any) {
    console.log('[UserService] create called with data:', data)
    return data
  }
}
