/**
 * Products Module
 *
 * Demonstrates another feature module.
 */

import { defineModule } from '../../../core'
import { ProductService } from './products.service'
import { listProducts, getProduct } from './products.routes'

export const ProductsModule = defineModule({
  name: 'products',

  routes: [
    listProducts,
    getProduct,
  ],

  providers: [
    ProductService,
  ],

  exports: [
    ProductService,
  ],
})
