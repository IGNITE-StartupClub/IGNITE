/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
  interface Locals {
    /** Set by src/middleware.ts on pages of the members area. */
    member?: { email: string; role: 'member' | 'admin' }
  }
}
