import { NeoTheme } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import {
  CITY_BY_CODE,
  RADIUS_OPTIONS,
  SERBIA_CITIES,
  mapUnitsPerKm,
  projectToMap,
} from "@/constants/serbia-cities";
import {
  SERBIA_MAP_HEIGHT,
  SERBIA_MAP_WIDTH,
  SERBIA_REGIONS,
} from "@/constants/serbia-map";
import { normalizeSearchText } from "@/constants/text";
import Ionicons from "@expo/vector-icons/Ionicons";
import React, { useMemo, useState } from "react";
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

type Props = {
  /** Izabrani gradovi (normalizovani nazivi iz serbia-cities.ts). */
  cities: string[];
  /** Precnik u kilometrima oko svakog izabranog grada. */
  radiusKm: number;
  onChangeCities: (next: string[]) => void;
  onChangeRadius: (next: number) => void;
};

/**
 * react-native-svg je NATIVE modul. Ako aplikacija radi na buildu koji ga jos
 * ne sadrzi, import bi pukao - zato se ucitava odbranjeno i, ako ga nema, mapa
 * se jednostavno ne crta. Izbor gradova radi i bez mape.
 */
let SvgRoot: any = null;
let SvgPath: any = null;
let SvgCircle: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- namerno: modul mora da se ucita odbranjeno
  const svgModule = require("react-native-svg");
  SvgRoot = svgModule.default ?? svgModule.Svg ?? null;
  SvgPath = svgModule.Path ?? null;
  SvgCircle = svgModule.Circle ?? null;
} catch {
  SvgRoot = null;
  SvgPath = null;
  SvgCircle = null;
}

class MapErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback: React.ReactNode },
  { failed: boolean }
> {
  state = { failed: false };

  static getDerivedStateFromError() {
    return { failed: true };
  }

  render() {
    return this.state.failed ? this.props.fallback : this.props.children;
  }
}

const UNITS_PER_KM = mapUnitsPerKm(SERBIA_MAP_HEIGHT);

function radiusLabel(radiusKm: number): string {
  return RADIUS_OPTIONS.find((option) => option.value === radiusKm)?.label ?? `${radiusKm} km`;
}

/**
 * Izbor lokacije signala: jedan ili vise gradova + precnik u kilometrima oko
 * njih. Mapa iznad sluzi samo za prikaz pokrivene povrsine, ne za izbor.
 * Prazan izbor gradova znaci celu Srbiju.
 */
export function LocationPicker({ cities, radiusKm, onChangeCities, onChangeRadius }: Props) {
  const [cityModalOpen, setCityModalOpen] = useState(false);
  const [radiusModalOpen, setRadiusModalOpen] = useState(false);
  const [query, setQuery] = useState("");

  const selected = useMemo(
    () => cities.map((code) => CITY_BY_CODE[code]).filter(Boolean),
    [cities],
  );

  const filtered = useMemo(() => {
    const q = normalizeSearchText(query).trim();
    if (!q) return SERBIA_CITIES;
    return SERBIA_CITIES.filter(
      (city) =>
        normalizeSearchText(city.label).includes(q) || city.code.includes(q),
    );
  }, [query]);

  const toggleCity = (code: string) => {
    onChangeCities(
      cities.includes(code) ? cities.filter((item) => item !== code) : [...cities, code],
    );
  };

  const map =
    SvgRoot && SvgPath && SvgCircle ? (
      <View style={styles.mapWrap}>
        <SvgRoot
          width="100%"
          height="100%"
          viewBox={`0 0 ${SERBIA_MAP_WIDTH} ${SERBIA_MAP_HEIGHT}`}
        >
          {SERBIA_REGIONS.map((region) =>
            region.paths.map((path, index) => (
              <SvgPath
                key={`${region.code}-${index}`}
                d={path}
                fill="rgba(255,255,255,0.14)"
                stroke={NeoTheme.colors.borderStrong}
                strokeWidth={2}
              />
            )),
          )}

          {selected.map((city) => {
            const point = projectToMap(city.lat, city.lon, SERBIA_MAP_WIDTH, SERBIA_MAP_HEIGHT);
            return (
              <SvgCircle
                key={`radius-${city.code}`}
                cx={point.x}
                cy={point.y}
                r={Math.max(radiusKm * UNITS_PER_KM, 8)}
                fill={NeoTheme.colors.limeGlow}
                stroke={NeoTheme.colors.limeBorder}
                strokeWidth={3}
              />
            );
          })}

          {selected.map((city) => {
            const point = projectToMap(city.lat, city.lon, SERBIA_MAP_WIDTH, SERBIA_MAP_HEIGHT);
            return (
              <SvgCircle
                key={`dot-${city.code}`}
                cx={point.x}
                cy={point.y}
                r={9}
                fill={NeoTheme.colors.lime}
              />
            );
          })}
        </SvgRoot>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      {map ? <MapErrorBoundary fallback={null}>{map}</MapErrorBoundary> : null}

      <View style={styles.dropdownRow}>
        <Pressable
          onPress={() => setCityModalOpen(true)}
          style={({ pressed }) => [styles.dropdown, pressed && styles.pressed]}
        >
          <View style={styles.dropdownCopy}>
            <Text style={styles.dropdownLabel}>Grad</Text>
            <Text style={styles.dropdownValue} numberOfLines={1}>
              {selected.length === 0
                ? "Cela Srbija"
                : selected.length === 1
                  ? selected[0].label
                  : `${selected.length} gradova`}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={rs(16)} color={NeoTheme.colors.textMuted} />
        </Pressable>

        <Pressable
          onPress={() => setRadiusModalOpen(true)}
          disabled={selected.length === 0}
          style={({ pressed }) => [
            styles.dropdown,
            styles.dropdownNarrow,
            selected.length === 0 && styles.dropdownDisabled,
            pressed && selected.length > 0 && styles.pressed,
          ]}
        >
          <View style={styles.dropdownCopy}>
            <Text style={styles.dropdownLabel}>Precnik</Text>
            <Text style={styles.dropdownValue} numberOfLines={1}>
              {radiusLabel(radiusKm)}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={rs(16)} color={NeoTheme.colors.textMuted} />
        </Pressable>
      </View>

      {selected.length > 0 && (
        <View style={styles.chipsWrap}>
          {selected.map((city) => (
            <Pressable
              key={city.code}
              onPress={() => toggleCity(city.code)}
              style={({ pressed }) => [styles.chip, pressed && styles.pressed]}
            >
              <Text style={styles.chipText}>{city.label}</Text>
              <Ionicons name="close" size={rs(13)} color={NeoTheme.colors.black} />
            </Pressable>
          ))}
          <Pressable
            onPress={() => onChangeCities([])}
            style={({ pressed }) => [styles.clearChip, pressed && styles.pressed]}
          >
            <Text style={styles.clearChipText}>Ocisti sve</Text>
          </Pressable>
        </View>
      )}

      <Text style={styles.hint}>
        {selected.length === 0
          ? "Nije izabran grad - signal prati celu Srbiju."
          : `Signal prati oglase do ${radiusKm} km od ${
              selected.length === 1 ? "izabranog grada" : "izabranih gradova"
            }.`}
      </Text>

      {/* Izbor gradova */}
      <Modal
        visible={cityModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setCityModalOpen(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Izaberi grad</Text>
              <Pressable
                onPress={() => setCityModalOpen(false)}
                style={({ pressed }) => [styles.modalClose, pressed && styles.pressed]}
              >
                <Ionicons name="close" size={rs(20)} color={NeoTheme.colors.text} />
              </Pressable>
            </View>

            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder="Pretrazi grad"
              placeholderTextColor={NeoTheme.colors.textDim}
              style={styles.search}
              autoCorrect={false}
              autoCapitalize="none"
            />

            <FlatList
              data={filtered}
              keyExtractor={(item) => item.code}
              keyboardShouldPersistTaps="handled"
              style={styles.modalList}
              initialNumToRender={20}
              windowSize={9}
              renderItem={({ item }) => {
                const active = cities.includes(item.code);
                return (
                  <Pressable
                    onPress={() => toggleCity(item.code)}
                    style={({ pressed }) => [styles.cityRow, pressed && styles.pressed]}
                  >
                    <Ionicons
                      name={active ? "checkbox" : "square-outline"}
                      size={rs(18)}
                      color={active ? NeoTheme.colors.lime : NeoTheme.colors.textMuted}
                    />
                    <Text style={[styles.cityRowText, active && styles.cityRowTextActive]}>
                      {item.label}
                    </Text>
                  </Pressable>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>Nema grada sa tim nazivom.</Text>
              }
            />

            <Pressable
              onPress={() => setCityModalOpen(false)}
              style={({ pressed }) => [styles.modalPrimary, pressed && styles.pressed]}
            >
              <Text style={styles.modalPrimaryText}>
                {cities.length > 0 ? `Gotovo (${cities.length})` : "Gotovo"}
              </Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* Izbor precnika */}
      <Modal
        visible={radiusModalOpen}
        transparent
        animationType="fade"
        onRequestClose={() => setRadiusModalOpen(false)}
      >
        <Pressable style={styles.modalBackdrop} onPress={() => setRadiusModalOpen(false)}>
          <View style={styles.radiusCard}>
            <Text style={styles.modalTitle}>Precnik pretrage</Text>
            {RADIUS_OPTIONS.map((option) => {
              const active = option.value === radiusKm;
              return (
                <Pressable
                  key={option.value}
                  onPress={() => {
                    onChangeRadius(option.value);
                    setRadiusModalOpen(false);
                  }}
                  style={({ pressed }) => [
                    styles.radiusRow,
                    active && styles.radiusRowActive,
                    pressed && styles.pressed,
                  ]}
                >
                  <Text style={[styles.radiusRowText, active && styles.radiusRowTextActive]}>
                    {option.label}
                  </Text>
                  {active && (
                    <Ionicons name="checkmark" size={rs(18)} color={NeoTheme.colors.black} />
                  )}
                </Pressable>
              );
            })}
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: rs(6),
    gap: rs(10),
  },
  mapWrap: {
    alignSelf: "center",
    width: rs(224),
    height: rs(326),
  },
  dropdownRow: {
    flexDirection: "row",
    gap: rs(10),
  },
  dropdown: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: rs(8),
    minHeight: rs(52),
    paddingHorizontal: rs(12),
    borderRadius: NeoTheme.radius.sm,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dropdownNarrow: {
    flex: 0,
    minWidth: rs(118),
  },
  dropdownDisabled: {
    opacity: 0.45,
  },
  dropdownCopy: {
    flex: 1,
    gap: rs(2),
  },
  dropdownLabel: {
    color: NeoTheme.colors.textDim,
    fontSize: rf(10),
    fontFamily: NeoTheme.fonts.medium,
    textTransform: "uppercase",
  },
  dropdownValue: {
    color: NeoTheme.colors.text,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  chipsWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(8),
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    paddingHorizontal: rs(10),
    paddingVertical: rs(7),
    borderRadius: rs(12),
    backgroundColor: NeoTheme.colors.lime,
  },
  chipText: {
    color: NeoTheme.colors.black,
    fontSize: rf(12),
    fontFamily: NeoTheme.fonts.bold,
  },
  clearChip: {
    paddingHorizontal: rs(10),
    paddingVertical: rs(7),
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
  },
  clearChipText: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(12),
    fontFamily: NeoTheme.fonts.medium,
  },
  hint: {
    color: NeoTheme.colors.textDim,
    fontSize: rf(11),
    fontFamily: NeoTheme.fonts.medium,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.72)",
    justifyContent: "center",
    padding: rs(20),
  },
  modalCard: {
    maxHeight: "82%",
    borderRadius: NeoTheme.radius.md,
    backgroundColor: NeoTheme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: rs(16),
    gap: rs(12),
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  modalTitle: {
    color: NeoTheme.colors.text,
    fontSize: rf(17),
    fontFamily: NeoTheme.fonts.bold,
  },
  modalClose: {
    padding: rs(4),
  },
  search: {
    minHeight: rs(44),
    borderRadius: NeoTheme.radius.sm,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    backgroundColor: "#242424",
    color: NeoTheme.colors.text,
    fontSize: rf(15),
    paddingHorizontal: rs(12),
    fontFamily: NeoTheme.fonts.medium,
  },
  modalList: {
    flexGrow: 0,
  },
  cityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(10),
    paddingVertical: rs(11),
  },
  cityRowText: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.medium,
  },
  cityRowTextActive: {
    color: NeoTheme.colors.text,
    fontFamily: NeoTheme.fonts.bold,
  },
  emptyText: {
    color: NeoTheme.colors.textDim,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.medium,
    paddingVertical: rs(16),
    textAlign: "center",
  },
  modalPrimary: {
    minHeight: rs(48),
    borderRadius: NeoTheme.radius.sm,
    backgroundColor: NeoTheme.colors.lime,
    alignItems: "center",
    justifyContent: "center",
  },
  modalPrimaryText: {
    color: NeoTheme.colors.black,
    fontSize: rf(15),
    fontFamily: NeoTheme.fonts.bold,
  },
  radiusCard: {
    borderRadius: NeoTheme.radius.md,
    backgroundColor: NeoTheme.colors.backgroundAlt,
    borderWidth: 1,
    borderColor: NeoTheme.colors.border,
    padding: rs(16),
    gap: rs(8),
  },
  radiusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    minHeight: rs(46),
    paddingHorizontal: rs(12),
    borderRadius: NeoTheme.radius.sm,
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
  },
  radiusRowActive: {
    backgroundColor: NeoTheme.colors.lime,
    borderColor: NeoTheme.colors.lime,
  },
  radiusRowText: {
    color: NeoTheme.colors.text,
    fontSize: rf(14),
    fontFamily: NeoTheme.fonts.semiBold,
  },
  radiusRowTextActive: {
    color: NeoTheme.colors.black,
  },
  pressed: {
    opacity: 0.84,
  },
});
