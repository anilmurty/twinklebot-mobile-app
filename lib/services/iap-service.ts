/**
 * In-App Purchase service using RevenueCat
 * Wraps RevenueCat SDK for iOS/Android native purchases
 */

import { isNativeApp, getPlatform } from '@/lib/utils/platform'

export interface IAPPackage {
  identifier: string
  productId: string
  priceString: string
  price: number
  currencyCode: string
  /** Number of story credits this package gives */
  credits: number
}

/** Map RevenueCat product IDs to story credit counts */
const PRODUCT_CREDITS: Record<string, number> = {
  'com.twinklebot.story.single': 1,
  'com.twinklebot.story.bundle2': 2,
  'com.twinklebot.story.bundle3': 3,
  'com.twinklebot.story.bundle4': 4,
}

/**
 * Fetch available IAP packages from RevenueCat
 */
export async function getIAPPackages(): Promise<IAPPackage[]> {
  if (!isNativeApp()) return []

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const offerings = await Purchases.getOfferings()

    console.log(`[IAP] Platform: ${getPlatform()}, offerings current: ${offerings.current?.identifier || 'none'}`)
    console.log(`[IAP] Available packages: ${offerings.current?.availablePackages?.length || 0}`)

    if (!offerings.current?.availablePackages) {
      console.warn('[IAP] No RevenueCat offerings available. Check that:')
      console.warn('[IAP] 1. Products are created in App Store Connect / Google Play Console')
      console.warn('[IAP] 2. Products are added to RevenueCat and linked to an offering')
      console.warn('[IAP] 3. The offering identifier is "default"')
      return []
    }

    const packages = offerings.current.availablePackages.map((pkg) => {
      const mapped = {
        identifier: pkg.identifier,
        productId: pkg.product.identifier,
        priceString: pkg.product.priceString,
        price: pkg.product.price,
        currencyCode: pkg.product.currencyCode,
        credits: PRODUCT_CREDITS[pkg.product.identifier] || 1,
      }
      console.log(`[IAP] Package: ${mapped.identifier} (${mapped.productId}) = ${mapped.priceString}, ${mapped.credits} credits`)
      return mapped
    })

    return packages
  } catch (err) {
    console.error('[IAP] Failed to fetch packages:', err)
    return []
  }
}

/**
 * Purchase an IAP package via RevenueCat
 * Returns true if purchase succeeded, false if cancelled or failed
 */
export async function purchasePackage(packageIdentifier: string): Promise<boolean> {
  if (!isNativeApp()) return false

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    const offerings = await Purchases.getOfferings()

    const pkg = offerings.current?.availablePackages?.find(
      (p) => p.identifier === packageIdentifier
    )

    if (!pkg) {
      throw new Error(`Package not found: ${packageIdentifier}`)
    }

    const { customerInfo } = await Purchases.purchasePackage({ aPackage: pkg })

    // Purchase succeeded — RevenueCat webhook will credit the user server-side
    console.log('Purchase successful, customer info:', customerInfo.originalAppUserId)
    return true
  } catch (err: any) {
    // User cancelled the purchase
    if (err?.code === 'PURCHASE_CANCELLED_ERROR' || err?.userCancelled) {
      console.log('Purchase cancelled by user')
      return false
    }

    console.error('Purchase failed:', err)
    throw err
  }
}

/**
 * Restore previous purchases (required by App Store)
 */
export async function restorePurchases(): Promise<boolean> {
  if (!isNativeApp()) return false

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    await Purchases.restorePurchases()
    return true
  } catch (err) {
    console.error('Failed to restore purchases:', err)
    throw err
  }
}

/**
 * Identify the user in RevenueCat (call after login)
 */
export async function identifyUser(userId: string): Promise<void> {
  if (!isNativeApp()) return

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    await Purchases.logIn({ appUserID: userId })
  } catch (err) {
    console.error('Failed to identify user in RevenueCat:', err)
  }
}

/**
 * Log out user from RevenueCat (call on sign out)
 */
export async function logoutUser(): Promise<void> {
  if (!isNativeApp()) return

  try {
    const { Purchases } = await import('@revenuecat/purchases-capacitor')
    await Purchases.logOut()
  } catch (err) {
    console.error('Failed to logout user from RevenueCat:', err)
  }
}
