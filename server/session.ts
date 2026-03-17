import crypto from 'node:crypto'

import type { Request, Response } from 'express'

import { config } from './config.js'

const SESSION_COOKIE_NAME = 'buy_admin_session'
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7

type SessionPayload = {
  email: string
  exp: number
}

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString('base64url')
}

function base64UrlDecode(value: string) {
  return Buffer.from(value, 'base64url').toString('utf8')
}

function signValue(value: string) {
  return crypto.createHmac('sha256', config.sessionSecret).update(value).digest('base64url')
}

function createToken(payload: SessionPayload) {
  const body = base64UrlEncode(JSON.stringify(payload))
  const signature = signValue(body)
  return `${body}.${signature}`
}

function verifyToken(token: string): SessionPayload | null {
  const [body, signature] = token.split('.')

  if (!body || !signature) {
    return null
  }

  const expected = signValue(body)

  if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected))) {
    return null
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as SessionPayload

    if (payload.exp < Date.now() || !payload.email) {
      return null
    }

    return payload
  } catch {
    return null
  }
}

export function getSessionFromRequest(request: Request) {
  const token = request.cookies?.[SESSION_COOKIE_NAME] as string | undefined

  if (!token) {
    return null
  }

  const payload = verifyToken(token)

  if (!payload) {
    return null
  }

  return {
    user: {
      email: payload.email,
    },
  }
}

export function setSessionCookie(response: Response, email: string) {
  const token = createToken({
    email,
    exp: Date.now() + SESSION_TTL_MS,
  })

  response.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    maxAge: SESSION_TTL_MS,
    path: '/',
  })
}

export function clearSessionCookie(response: Response) {
  response.clearCookie(SESSION_COOKIE_NAME, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProduction,
    path: '/',
  })
}
