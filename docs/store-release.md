# Store Release

## EAS CLI Setup

```sh
eas login
eas credentials --platform android
eas credentials --platform ios
eas build --platform all --profile production
eas submit --platform all --profile production --latest
```

Android submit uses EAS-managed Google service-account credentials. Upload the service-account JSON once with `eas credentials --platform android`; do not commit it.

iOS submit uses the non-secret defaults in `eas.json`. App Store Connect credentials, team, and app record access are provided interactively by EAS CLI or through environment variables.

## Metadata

EAS Metadata currently manages Apple App Store metadata. Google Play listings and Data Safety still need Play Console work.

To use the example metadata:

```sh
cp docs/store-config.example.json store.config.json
```

Then replace:

- `REPLACE_WITH_PUBLIC_PRIVACY_POLICY_URL`
- `REPLACE_WITH_PUBLIC_SUPPORT_URL`

After the App Store Connect app record exists and a binary has been uploaded:

```sh
eas metadata:lint
eas metadata:push --profile production
```

## Store Inputs Still Required

- Apple Developer team access and App Store Connect app record.
- Google Play app record and first manual upload if Play API has not accepted this package yet.
- Public privacy policy URL.
- Public support URL.
- App Store privacy answers for foreground location use and network requests to Overpass/OpenStreetMap.
- Play Data Safety answers for foreground location use and network transmission.
- Content rating, target audience, pricing, availability, screenshots, and review contact details.
