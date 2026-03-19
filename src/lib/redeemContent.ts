import type { RichTextJson } from '../types/content'
import { EMPTY_RICH_TEXT, getRichTextTextBlocks } from './richText'

export type RedeemDeliveryField = {
  id: string
  label: string
  value: string
}

export type RedeemContentFields = {
  deliveryFields: RedeemDeliveryField[]
  otherContent: string
}

type LegacyRedeemContentFields = {
  account: string
  password: string
  twoFactorCode: string
  otherContent: string
}

type StructuredRedeemContentV1 = {
  schema: 'redeem-delivery-v1'
  fields: LegacyRedeemContentFields
  renderedContent: RichTextJson
}

type StructuredRedeemContentV2 = {
  schema: 'redeem-delivery-v2'
  deliveryFields: RedeemDeliveryField[]
  otherContent: string
  renderedContent: RichTextJson
}

const DEFAULT_REDEEM_FIELD_LABELS = ['账号', '密码', '2FA'] as const

function normalizeSingleLine(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function normalizeMultiLine(value: unknown) {
  return typeof value === 'string' ? value.trim() : ''
}

function createFieldId() {
  if (typeof globalThis.crypto?.randomUUID === 'function') {
    return globalThis.crypto.randomUUID()
  }

  return `redeem-field-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`
}

export function getDefaultRedeemFieldLabel(index: number) {
  return DEFAULT_REDEEM_FIELD_LABELS[index] ?? `字段 ${index + 1}`
}

export function createRedeemDeliveryField(partial?: Partial<RedeemDeliveryField>, index = 0): RedeemDeliveryField {
  return {
    id: normalizeSingleLine(partial?.id) || createFieldId(),
    label: normalizeSingleLine(partial?.label) || getDefaultRedeemFieldLabel(index),
    value: normalizeMultiLine(partial?.value),
  }
}

export function createDefaultRedeemContentFields(): RedeemContentFields {
  return {
    deliveryFields: DEFAULT_REDEEM_FIELD_LABELS.map((label, index) => createRedeemDeliveryField({ label }, index)),
    otherContent: '',
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

function normalizeDeliveryFields(value: unknown) {
  if (!Array.isArray(value)) {
    return createDefaultRedeemContentFields().deliveryFields
  }

  return value
    .map((item, index) => {
      if (!item || typeof item !== 'object' || Array.isArray(item)) {
        return null
      }

      return createRedeemDeliveryField(item as Partial<RedeemDeliveryField>, index)
    })
    .filter((item): item is RedeemDeliveryField => Boolean(item))
}

function normalizeStructuredRedeemContent(input?: Partial<RedeemContentFields>): RedeemContentFields {
  return {
    deliveryFields: normalizeDeliveryFields(input?.deliveryFields),
    otherContent: normalizeMultiLine(input?.otherContent),
  }
}

function normalizeLegacyRedeemContent(fields?: Partial<LegacyRedeemContentFields>): RedeemContentFields {
  return {
    deliveryFields: [
      createRedeemDeliveryField({ label: '账号', value: normalizeSingleLine(fields?.account) }, 0),
      createRedeemDeliveryField({ label: '密码', value: normalizeSingleLine(fields?.password) }, 1),
      createRedeemDeliveryField({ label: '2FA', value: normalizeSingleLine(fields?.twoFactorCode) }, 2),
    ],
    otherContent: normalizeMultiLine(fields?.otherContent),
  }
}

function isStructuredRedeemContentV1(content: RichTextJson): content is RichTextJson & StructuredRedeemContentV1 {
  return content.schema === 'redeem-delivery-v1' && typeof content.fields === 'object' && content.fields !== null
}

function isStructuredRedeemContentV2(content: RichTextJson): content is RichTextJson & StructuredRedeemContentV2 {
  return content.schema === 'redeem-delivery-v2' && Array.isArray(content.deliveryFields)
}

function createRenderedContent(fields: RedeemContentFields): RichTextJson {
  const content = [
    ...fields.deliveryFields.flatMap((field) => createSectionNodes(field.label, field.value)),
    ...createSectionNodes('其他说明', fields.otherContent),
  ]

  if (content.length === 0) {
    return EMPTY_RICH_TEXT
  }

  return {
    type: 'doc',
    content,
  }
}

export function createRedeemContent(input?: Partial<LegacyRedeemContentFields> | Partial<RedeemContentFields>): RichTextJson {
  const normalizedFields = input && 'deliveryFields' in input ? normalizeStructuredRedeemContent(input) : normalizeLegacyRedeemContent(input)

  return {
    schema: 'redeem-delivery-v2',
    deliveryFields: normalizedFields.deliveryFields,
    otherContent: normalizedFields.otherContent,
    renderedContent: createRenderedContent(normalizedFields),
  }
}

export function readStructuredRedeemContent(content: RichTextJson) {
  if (isStructuredRedeemContentV2(content)) {
    return normalizeStructuredRedeemContent({
      deliveryFields: content.deliveryFields,
      otherContent: content.otherContent,
    })
  }

  if (isStructuredRedeemContentV1(content)) {
    return normalizeLegacyRedeemContent(content.fields)
  }

  return null
}

export function readRedeemContentFields(content: RichTextJson) {
  const structuredContent = readStructuredRedeemContent(content)

  if (structuredContent) {
    return structuredContent
  }

  const blocks = getRichTextTextBlocks(content)

  return {
    ...createDefaultRedeemContentFields(),
    otherContent: blocks.join('\n'),
  }
}

export function getRedeemContentDocument(content: RichTextJson) {
  if (isStructuredRedeemContentV2(content)) {
    if (content.renderedContent && typeof content.renderedContent === 'object' && !Array.isArray(content.renderedContent)) {
      return content.renderedContent
    }

    return createRenderedContent(
      normalizeStructuredRedeemContent({
        deliveryFields: content.deliveryFields,
        otherContent: content.otherContent,
      }),
    )
  }

  if (isStructuredRedeemContentV1(content)) {
    if (content.renderedContent && typeof content.renderedContent === 'object' && !Array.isArray(content.renderedContent)) {
      return content.renderedContent
    }

    return createRenderedContent(normalizeLegacyRedeemContent(content.fields))
  }

  return content ?? EMPTY_RICH_TEXT
}
