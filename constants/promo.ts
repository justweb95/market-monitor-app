// The single "drugarski" promo code that grants the free Bronze-tier
// bonus (see notification.controller.ts / SUBSCRIPTION_SYSTEM.md on the
// backend for the matching precedence rule). Kept as one shared constant so
// the three screens that check `profile.user.promoCodeUsed` against it can't
// drift out of sync with each other.
export const DRUGARSKI_PROMO_CODE = "03081995";
