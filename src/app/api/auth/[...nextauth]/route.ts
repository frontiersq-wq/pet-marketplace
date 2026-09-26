import { handlers } from "@/lib/auth";

// Auth.js serves every /api/auth/* route (sign-in, callback, session, CSRF)
// from this single catch-all handler pair.
export const { GET, POST } = handlers;
