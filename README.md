# market-monitor-app

Mobile aplikacija za Market Monitor / Lovac na Oglase.

## Stack

- Expo + React Native
- Expo Router
- Expo Notifications
- RevenueCat (`react-native-purchases`)

## Trenutni status

- Core UX i glavni flow-ovi su funkcionalni.
- Trial/subscription/paywall integracija je aktivna.
- Profil ekran prikazuje trial i subscription stanje.
- Potreban finalni deployment i E2E verifikacija na Android/iOS buildovima.

## Pokretanje

```bash
npm install
npm run start
```

Korisne skripte:

- `npm run android`
- `npm run ios`
- `npm run web`
- `npm run build:android:test`

## Konfiguracija okruzenja

Aplikacija koristi ove env promenljive:

- `EXPO_PUBLIC_API_URL`
- `EXPO_PUBLIC_PUSH_MODE` (`auto` ili `off`)
- `EXPO_PUBLIC_REVENUECAT_IOS_KEY`
- `EXPO_PUBLIC_REVENUECAT_ANDROID_KEY`

Napomena:
- Default API fallback je trenutno ngrok URL definisan u `constants/env.ts`.

## Kljucni delovi aplikacije

- `app/(tabs)/index.tsx` - Home ekran
- `app/(tabs)/alerts.tsx` - Alert management
- `app/(tabs)/favorites.tsx` - Favoriti
- `app/profile.tsx` - Profil, promo code i subscription akcije
- `components/paywall-gate.tsx` - Zakljucavanje aplikacije po subscription logici
- `hooks/useSubscription.ts` - RevenueCat tok (offerings, purchase, restore)
- `hooks/useAccountProfile.ts` - Profil stanje i plan/tier polja

## Produkcija - prioriteti

1. Potvrditi Android build na fizickom uredjaju (sanity + push test).
2. Zavrsiti iOS build/TestFlight tok.
3. Verifikovati subscription webhook tok od kupovine do backend status update-a.
4. Dokumentovati finalni release flow (build -> smoke test -> rollout).

## Povezano

- Root status: `../README.md`
- Subscription detalji: `../SUBSCRIPTION_SYSTEM.md`
- Operativni plan: `../nextstep.md`
