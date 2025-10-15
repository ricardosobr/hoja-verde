import { use } from 'react'

export function useParams<T>(params: Promise<T> | T): T {
  if (params instanceof Promise) {
    return use(params)
  }
  return params
}
