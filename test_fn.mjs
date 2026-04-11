import { createServerFn } from '@tanstack/react-start'
const fn = createServerFn({ method: 'POST' })
console.log(Object.keys(fn))
console.log(typeof fn.validator)
console.log(typeof fn.handler)
