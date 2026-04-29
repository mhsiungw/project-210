import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react'

export interface Post {
  id: number
  title: string
  body: string
  userId: number
}

export const exampleApi = createApi({
  reducerPath: 'exampleApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://jsonplaceholder.typicode.com/' }),
  endpoints: builder => ({
    getPost: builder.query<Post, number>({
      query: id => `posts/${id}`,
    }),
  }),
})

export const { useGetPostQuery } = exampleApi
