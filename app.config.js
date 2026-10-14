// Meta (Facebook) SDK: Meta vidi instalacije i otvaranja aplikacije iz reklama,
// pa App promotion kampanja može da optimizuje na instalacije.
// Osnovna konfiguracija ostaje u app.json; ovde se samo dodaje SDK plugin.
// Client token se ne čuva u kodu: čita se iz META_CLIENT_TOKEN (eas.json env ili EAS env).

const META_APP_ID = '3073607999651579';
const PLACEHOLDER = 'REPLACE_WITH_META_CLIENT_TOKEN';

module.exports = ({ config }) => {
  const clientToken = process.env.META_CLIENT_TOKEN;
  const hasToken = Boolean(clientToken) && clientToken !== PLACEHOLDER;

  if (!hasToken) {
    const msg =
      'META_CLIENT_TOKEN nije podešen (developers.facebook.com → aplikacija → App settings → Advanced → Security → Client token).';
    // Produkcijski build bez tokena bi izašao bez merenja instalacija, zato ga zaustavljamo.
    if (process.env.EAS_BUILD_PROFILE === 'production') {
      throw new Error(msg);
    }
    console.warn(`[meta-sdk] ${msg} Ovaj build ide bez Meta SDK podešavanja.`);
    // Bez tokena ne dodajemo SDK konfiguraciju, da se SDK ne bi pokretao napola podešen.
    return config;
  }

  return {
    ...config,
    plugins: [
      ...(config.plugins ?? []),
      [
        'react-native-fbsdk-next',
        {
          appID: META_APP_ID,
          clientToken,
          displayName: config.name,
          scheme: `fb${META_APP_ID}`,
          // Potrebno da Meta automatski zabeleži instalaciju i otvaranje aplikacije.
          isAutoInitEnabled: true,
          autoLogAppEventsEnabled: true,
          advertiserIDCollectionEnabled: true,
          // iOS verzija još ne izlazi; ATT tekst dodajemo kad bude iOS builda.
          iosUserTrackingPermission: false,
        },
      ],
    ],
  };
};
