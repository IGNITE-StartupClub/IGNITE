/**
 * Who may become the first admin while the members collection has no admin, so the members area can start in
 * production without database access: a listed person requests a code on the login page, becomes admin and adds
 * everyone else on /mitglieder/verwaltung. Once an admin exists the list has no effect.
 * SHA-256 of the lowercased address, not the address, because the repository is public. A new entry:
 *   printf '%s' 'vorname.nachname@stud.leuphana.de' | shasum -a 256
 */
export const INITIAL_ADMIN_HASHES = [
  '1ff6b1864ea19ba3d74c537efd94f81d3d8ee54d16e2e0f8c64c0701f4ca0208',
  '2fbf2031c6cb16c178ab6a371ce59de1579bb7275f2e14c4e6aa79098b2b210a',
]

/**
 * Owners ("Hauptadmin"): admins whom no other admin can demote or remove on /mitglieder/verwaltung (/api/members/admin).
 * Same SHA-256 format as above. Removing an owner takes a change here or scripts/members.mjs.
 */
export const OWNER_HASHES = ['1ff6b1864ea19ba3d74c537efd94f81d3d8ee54d16e2e0f8c64c0701f4ca0208']

/**
 * The board ("Vorstand") works across all teams, so the start page asks them for no team. Grants no rights.
 * Same SHA-256 format as above. A new board takes a change here and a deploy.
 */
export const BOARD_HASHES = [
  '4d6245266c991e18c419cef966c8985beb48a3c266f8cb9a5f347293f5c8eb28',
  'ac227e3ce53b4bf9a30576f199bde3c3582c3994ba032da5041e9e82bd4df8b0',
  '2fbf2031c6cb16c178ab6a371ce59de1579bb7275f2e14c4e6aa79098b2b210a',
]
