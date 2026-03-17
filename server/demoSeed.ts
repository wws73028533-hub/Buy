import type { Pool, PoolClient } from 'pg'

type SeedProduct = {
  slug: string
  title: string
  coverImageUrl: string | null
  contentJson: Record<string, unknown>
  sortOrder: number
  isPublished: boolean
}

type SeedTutorial = {
  title: string
  type: 'link' | 'file'
  url: string | null
  fileUrl: string | null
  sortOrder: number
  isPublished: boolean
}

type SeedContact = {
  label: string
  value: string
  linkUrl: string | null
  qrImageUrl: string | null
  sortOrder: number
  isPublished: boolean
}

function createProductContent({
  intro,
  audience,
  includes,
}: {
  intro: string
  audience: string[]
  includes: string[]
}) {
  return {
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [{ type: 'text', text: intro }],
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '适合谁' }],
      },
      {
        type: 'bulletList',
        content: audience.map((item) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: item }],
            },
          ],
        })),
      },
      {
        type: 'heading',
        attrs: { level: 2 },
        content: [{ type: 'text', text: '你会得到什么' }],
      },
      {
        type: 'bulletList',
        content: includes.map((item) => ({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: [{ type: 'text', text: item }],
            },
          ],
        })),
      },
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: '下单前建议先看使用指南；如果还想确认细节，可直接前往咨询售后页面联系商家。',
          },
        ],
      },
    ],
  }
}

const demoProducts: SeedProduct[] = [
  {
    slug: 'ai-collaboration-membership',
    title: 'AI 协作尊享权益',
    coverImageUrl: '/demo-ai-membership.svg',
    contentJson: createProductContent({
      intro: '适合想快速开启高频协作、同时重视上手体验与售后支持的用户。',
      audience: ['想尽快开始体验核心功能的人', '更看重省心服务与资料指引的人', '希望先从稳定方案开始了解的人'],
      includes: ['清晰的亮点说明与适用场景介绍', '配套的上手指南与常见问题入口', '咨询售后页面可继续承接购买前后问题'],
    }),
    sortOrder: 0,
    isPublished: true,
  },
  {
    slug: 'starter-efficiency-kit',
    title: '轻享效率入门包',
    coverImageUrl: '/demo-efficiency-kit.svg',
    contentJson: createProductContent({
      intro: '适合第一次了解这类商品的用户，先小成本体验，再决定是否继续深入。',
      audience: ['想先快速判断是否适合自己的人', '偏好简单清晰购买路径的人', '希望先看说明再做决定的人'],
      includes: ['更轻量的入门介绍与亮点说明', '适合新手快速查看的使用指南', '如需确认细节，可直接联系售前咨询'],
    }),
    sortOrder: 1,
    isPublished: true,
  },
]

const demoTutorials: SeedTutorial[] = [
  {
    title: '新手上手指南',
    type: 'link',
    url: '/demo-getting-started.html',
    fileUrl: null,
    sortOrder: 0,
    isPublished: true,
  },
  {
    title: '选购建议与常见问题',
    type: 'link',
    url: '/demo-shopping-faq.html',
    fileUrl: null,
    sortOrder: 1,
    isPublished: true,
  },
]

const demoContacts: SeedContact[] = [
  {
    label: '售前咨询顾问',
    value: '下单前想确认适合人群、服务内容或使用方式，可先发邮件咨询，我们会尽快回复。',
    linkUrl: 'mailto:service@example.com?subject=%E5%94%AE%E5%89%8D%E5%92%A8%E8%AF%A2',
    qrImageUrl: null,
    sortOrder: 0,
    isPublished: true,
  },
  {
    label: '订单与售后支持',
    value: '购买后如需补充资料、使用答疑或售后处理，请备注订单号和问题描述，沟通会更高效。',
    linkUrl: 'mailto:support@example.com?subject=%E5%94%AE%E5%90%8E%E6%94%AF%E6%8C%81',
    qrImageUrl: null,
    sortOrder: 1,
    isPublished: true,
  },
]

async function readTableCount(client: PoolClient, tableName: 'products' | 'tutorial_items' | 'contact_items') {
  const result = await client.query<{ count: number }>(`select count(*)::int as count from ${tableName}`)
  return result.rows[0]?.count ?? 0
}

async function insertProducts(client: PoolClient, items: SeedProduct[]) {
  for (const item of items) {
    await client.query(
      `insert into products (slug, title, cover_image_url, content_json, sort_order, is_published)
       values ($1, $2, $3, $4, $5, $6)`,
      [item.slug, item.title, item.coverImageUrl, item.contentJson, item.sortOrder, item.isPublished],
    )
  }
}

async function insertTutorials(client: PoolClient, items: SeedTutorial[]) {
  for (const item of items) {
    await client.query(
      `insert into tutorial_items (title, type, url, file_url, sort_order, is_published)
       values ($1, $2, $3, $4, $5, $6)`,
      [item.title, item.type, item.url, item.fileUrl, item.sortOrder, item.isPublished],
    )
  }
}

async function insertContacts(client: PoolClient, items: SeedContact[]) {
  for (const item of items) {
    await client.query(
      `insert into contact_items (label, value, link_url, qr_image_url, sort_order, is_published)
       values ($1, $2, $3, $4, $5, $6)`,
      [item.label, item.value, item.linkUrl, item.qrImageUrl, item.sortOrder, item.isPublished],
    )
  }
}

export async function seedDefaultShowcaseContent(pool: Pool) {
  const client = await pool.connect()

  try {
    await client.query('begin')

    const productCount = await readTableCount(client, 'products')
    const tutorialCount = await readTableCount(client, 'tutorial_items')
    const contactCount = await readTableCount(client, 'contact_items')

    if (productCount === 0) {
      await insertProducts(client, demoProducts)
    }

    if (tutorialCount === 0) {
      await insertTutorials(client, demoTutorials)
    }

    if (contactCount === 0) {
      await insertContacts(client, demoContacts)
    }

    await client.query('commit')
  } catch (error) {
    await client.query('rollback')
    throw error
  } finally {
    client.release()
  }
}
