import Constants, { ExecutionEnvironment } from 'expo-constants';
import { Platform } from 'react-native';

const IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY;
const ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY;
const CREDIT_POLL_INTERVAL_MS = 2000;
const CREDIT_POLL_TIMEOUT_MS = 45_000;

/** Expo Go lacks RevenueCat's native module; purchases need a development build. */
const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

const apiKey = isExpoGo
  ? undefined
  : Platform.OS === 'ios'
    ? IOS_KEY
    : Platform.OS === 'android'
      ? ANDROID_KEY
      : undefined;

/** Passes are sold through the App Store / Play Store only, so not on web or in Expo Go. */
export const canPurchase = Boolean(apiKey);

let configuredFor: string | null = null;

async function sdk() {
  const module = await import('react-native-purchases');
  return module.default;
}

/** Keeps RevenueCat's user in sync with Supabase so webhooks name the right account. */
export async function syncPurchasesUser(userId: string | null): Promise<void> {
  if (!apiKey || userId === configuredFor) return;
  try {
    const Purchases = await sdk();
    if (configuredFor === null && userId) {
      Purchases.configure({ apiKey, appUserID: userId });
    } else if (userId) {
      await Purchases.logIn(userId);
    } else {
      await Purchases.logOut();
    }
    configuredFor = userId;
  } catch (error) {
    console.error('RevenueCat sync failed', error);
  }
}

/** Localized store prices keyed by product id. Empty when purchases are unavailable. */
export async function fetchStorePrices(productIds: string[]): Promise<Map<string, string>> {
  if (!apiKey || productIds.length === 0) return new Map();
  try {
    const Purchases = await sdk();
    const products = await Purchases.getProducts(
      productIds,
      Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION
    );
    return new Map(products.map((p) => [p.identifier, p.priceString]));
  } catch (error) {
    console.error('Could not load store prices', error);
    return new Map();
  }
}

export type PurchaseOutcome = 'purchased' | 'cancelled';

export async function buyProduct(productId: string): Promise<PurchaseOutcome> {
  if (!apiKey) throw new Error('Purchases are only available in the mobile app.');
  const Purchases = await sdk();
  const [product] = await Purchases.getProducts([productId], Purchases.PRODUCT_CATEGORY.NON_SUBSCRIPTION);
  if (!product) throw new Error('This isn’t available in the store right now.');
  try {
    await Purchases.purchaseStoreProduct(product);
    return 'purchased';
  } catch (error) {
    if (error && typeof error === 'object' && 'userCancelled' in error && error.userCancelled) {
      return 'cancelled';
    }
    throw error;
  }
}

/**
 * The credit is granted by our webhook, not the app, so wait for it to land.
 * Resolves true once `fetchCounts` reports more than `previousCount` for `id`.
 */
export async function waitForCredit(
  fetchCounts: () => Promise<Map<string, number>>,
  id: string,
  previousCount: number
): Promise<boolean> {
  const deadline = Date.now() + CREDIT_POLL_TIMEOUT_MS;
  while (Date.now() < deadline) {
    const credits = await fetchCounts();
    if ((credits.get(id) ?? 0) > previousCount) return true;
    await new Promise((resolve) => setTimeout(resolve, CREDIT_POLL_INTERVAL_MS));
  }
  return false;
}
