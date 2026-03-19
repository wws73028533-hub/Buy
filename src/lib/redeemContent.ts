import type { RichTextJson } from '../types/content'
import { EMPTY_RICH_TEXT, getRichTextTextBlocks } from './richText'

export type RedeemContentFields = {
  account: string
  password: string
  twoFactorCode: string
  otherContent: string
}

type StructuredRedeemContent = {
  schema: 'redeem-delivery-v1'
  fields: RedeemContentFields
  renderedContent: RichTextJson
}

export const EMPTY_REDEEM_CONTENT_FIELDS: RedeemContentFields = {
  account: '',
  password: '',
  twoFactorCode: '',
  otherContent: '',
}

function normalizeSingleLine(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeMultiLine(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeFields(fields?: Partial<RedeemContentFields>): RedeemContentFields {
  return {
    account: normalizeSingleLine(fields?.account),
    password: normalizeSingleLine(fields?.password),
    twoFactorCode: normalizeSingleLine(fields?.twoFactorCode),
    otherContent: normalizeMultiLine(fields?.otherContent),
  }
}

function createParagraph(text: string) {
  return {
    type: 'paragraph',
    content: [{ type: 'text', text }],
  }
}

function createHeading(text: string) {
  return {
    type: 'heading',
    attrs: { level: 2 },
    content: [{ type: 'text', text }],
  }
}

function createSectionNodes(title: string, value: string) {
  if (!value) {
    return []
  }

  const paragraphs = value
    .split(/\n+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => createParagraph(item))

  return [createHeading(title), ...paragraphs]
}

function isStructuredRedeemContent(content: RichTextJson): content is RichTextJson & StructuredRedeemContent {
  return content.schema === 'redeem-delivery-v1' && typeof content.fields === 'object' && content.fields !== null
}

function createRenderedContent(fields: RedeemContentFields): RichTextJson {
  const content = [
    ...createSectionNodes('账号', fields.account),
    ...createSectionNodes('密码', fields.password),
    ...createSectionNodes('2FA / 验证信息', fields.twoFactorCode),
    ...createSectionNodes('其他内容', fields.otherContent),
  ]

  if (content.length === 0) {
    return EMPTY_RICH_TEXT
  }

  return {
    type: 'doc',
    content,
  }
}

export function createRedeemContent(fields?: Partial<RedeemContentFields>): RichTextJson {
  const normalizedFields = normalizeFields(fields)

  return {
    schema: 'redeem-delivery-v1',
    fields: normalizedFields,
    renderedContent: createRenderedContent(normalizedFields),
  }
}

export function readRedeemContentFields(content: RichTextJson) {
  if (isStructuredRedeemContent(content)) {
    return normalizeFields(content.fields)
  }

  const blocks = getRichTextTextBlocks(content)

  return {
    ...EMPTY_REDEEM_CONTENT_FIELDS,
    otherContent: blocks.join('\n'),
  }
}

export function getRedeemContentDocument(content: RichTextJson) {
  if (isStructuredRedeemContent(content)) {
    if (content.renderedContent && typeof content.renderedContent === 'object' && !Array.isArray(content.renderedContent)) {
      return content.renderedContent
    }

    return createRenderedContent(normalizeFields(content.fields))
  }

  return content ?? EMPTY_RICH_TEXT
}
