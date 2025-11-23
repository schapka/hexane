#!/usr/bin/env node

// eslint-disable-next-line antfu/no-top-level-await
const { main } = await import('../dist/index.mjs')
void main()
