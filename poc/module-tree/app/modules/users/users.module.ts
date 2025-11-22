/**
 * Users Module
 *
 * Demonstrates a feature module with routes and services.
 */

import { defineModule } from '../../../core'
import { UserService } from './users.service'
import { listUsers, getUser, createUser } from './users.routes'

export const UsersModule = defineModule({
  name: 'users',

  // Routes this module provides
  routes: [
    listUsers,
    getUser,
    createUser,
  ],

  // Services this module registers
  providers: [
    UserService,
  ],

  // Export UserService so other modules can use it
  exports: [
    UserService,
  ],
})
