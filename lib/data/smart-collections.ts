import type { PortfolioImage, SmartCollectionRule } from '@/types'

function imageYear(image: PortfolioImage): number {
  return new Date(image.exif.takenAt ?? image.createdAt).getFullYear()
}

function matchesRule(image: PortfolioImage, rule: SmartCollectionRule): boolean {
  switch (rule.field) {
    case 'rating': {
      const v = Number(rule.value)
      if (rule.operator === 'gte') return image.rating >= v
      if (rule.operator === 'lte') return image.rating <= v
      return image.rating === v
    }
    case 'keyword':
      return image.keywords.some((k) => k.toLowerCase() === String(rule.value).toLowerCase())
    case 'camera':
      return (image.exif.camera ?? '').toLowerCase().includes(String(rule.value).toLowerCase())
    case 'year':
      return imageYear(image) === Number(rule.value)
    case 'isBlackAndWhite':
      return image.isBlackAndWhite === (rule.value === true || rule.value === 'true')
    case 'location':
      return (image.location ?? '').toLowerCase().includes(String(rule.value).toLowerCase())
    default:
      return false
  }
}

/** Smart collection membership is AND across all rules — an image must match every rule to be included. */
export function evaluateSmartRules(rules: SmartCollectionRule[] | null | undefined, images: PortfolioImage[]): PortfolioImage[] {
  if (!rules || rules.length === 0) return []
  return images.filter((img) => rules.every((r) => matchesRule(img, r)))
}
