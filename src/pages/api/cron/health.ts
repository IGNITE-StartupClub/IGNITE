export const prerender = false

import type { APIRoute } from 'astro'
import { MongoClient } from 'mongodb'

export const GET: APIRoute = async () => {
  const client = new MongoClient(process.env.MONGODB_URI!)
  try {
    const start = Date.now()
    await client.connect()
    await client.db(process.env.MONGODB_DB!).command({ ping: 1 })
    const latencyMs = Date.now() - start

    return new Response(
      JSON.stringify({ status: 'ok', db: 'connected', latencyMs, ts: new Date().toISOString() }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    )
  } catch (err: any) {
    return new Response(
      JSON.stringify({ status: 'error', message: err.message, ts: new Date().toISOString() }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    )
  } finally {
    await client.close()
  }
}
