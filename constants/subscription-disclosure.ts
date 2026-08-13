import { Alert, Platform } from "react-native";

const DISCLOSURE_TITLE = "Potvrda pretplate";
const DISCLOSURE_MESSAGE = [
  "- Pretplata se automatski obnavlja svakog meseca",
  "- Teretiće se tvoj Google Play nalog",
  "- Možeš otkazati u bilo kom trenutku kroz Google Play Subscriptions",
  "- Otkazivanje ne briše odmah Premium pristup, već važi do kraja plaćenog perioda",
].join("\n");

export function confirmSubscriptionDisclosure(): Promise<boolean> {
  if (Platform.OS !== "android") {
    return Promise.resolve(true);
  }

  return new Promise((resolve) => {
    Alert.alert(DISCLOSURE_TITLE, DISCLOSURE_MESSAGE, [
      {
        text: "Otkaži",
        style: "cancel",
        onPress: () => resolve(false),
      },
      {
        text: "Nastavi",
        onPress: () => resolve(true),
      },
    ]);
  });
}