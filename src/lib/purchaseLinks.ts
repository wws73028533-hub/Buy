import type { Product, PurchaseLink } from '../types/content'

const DEFAULT_PURCHASE_LINK_LABEL = '默认入口'

function getDefaultPurchaseLinkLabel(index: number) {
  return index === 0 ? DEFAULT_PURCHASE_LINK_LABEL : `入口 ${index + 1}`
}

export function createEmptyPurchaseLink(): PurchaseLink {
  return {
    label: '',
    url: '',
  }
}

export function sanitizePurchaseLinks(links: PurchaseLink[]) {
  return links.reduce<PurchaseLink[]>((result, item) => {
    const label = item.label.trim()
    const url = item.url.trim()

    if (!label && !url) {
      return result
    }

    if (!url) {
      throw new Error(`请填写第 ${result.length + 1} 个购买入口的链接地址`)
    }

    result.push({
      label: label || getDefaultPurchaseLinkLabel(result.length),
      url,
    })

    return result
  }, [])
}

export function getProductPurchaseLinks(product: Pick<Product, 'purchaseLinks' | 'purchaseLinkUrl'>): PurchaseLink[] {
  const linksFromList = Array.isArray(product.purchaseLinks)
    ? product.purchaseLinks.reduce<PurchaseLink[]>((result, item) => {
        const url = item.url.trim()

        if (!url) {
          return result
        }

        result.push({
          label: item.label.trim() || getDefaultPurchaseLinkLabel(result.length),
          url,
        })

        return result
      }, [])
    : []

  if (linksFromList.length > 0) {
    return linksFromList
  }

  const legacyUrl = product.purchaseLinkUrl?.trim()

  if (!legacyUrl) {
    return []
  }

  return [
    {
      label: DEFAULT_PURCHASE_LINK_LABEL,
      url: legacyUrl,
    },
  ]
}
