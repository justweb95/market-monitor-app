import { NeoTheme } from "@/constants/neo-theme";
import { rf, rs } from "@/constants/responsive";
import {
  SERBIA_MAP_HEIGHT,
  SERBIA_MAP_WIDTH,
  SERBIA_REGIONS,
  type RegionCode,
} from "@/constants/serbia-map";
import Ionicons from "@expo/vector-icons/Ionicons";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

type Props = {
  selected: RegionCode[];
  onToggle: (code: RegionCode) => void;
};

/**
 * react-native-svg je NATIVE modul. Ako aplikacija radi na buildu koji ga jos
 * ne sadrzi (npr. dev-client napravljen pre nego sto je paket dodat), import
 * ili render bi pukao - zato se ucitava odbranjeno i, ako ga nema, prikazuje se
 * samo lista regiona. Funkcionalnost izbora regiona radi u oba slucaja.
 */
let SvgRoot: any = null;
let SvgPath: any = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-require-imports -- namerno: modul mora da se ucita odbranjeno
  const svgModule = require("react-native-svg");
  SvgRoot = svgModule.default ?? svgModule.Svg ?? null;
  SvgPath = svgModule.Path ?? null;
} catch {
  SvgRoot = null;
  SvgPath = null;
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

/**
 * Izbor regiona Srbije preko mape. Vise regiona moze biti cekirano istovremeno;
 * ako nijedan nije izabran, signal vazi za celu teritoriju Srbije.
 */
export function SerbiaRegionMap({ selected, onToggle }: Props) {
  const isSelected = (code: RegionCode) => selected.includes(code);
  const anySelected = selected.length > 0;

  const regionList = (
    <View style={styles.legend}>
      {SERBIA_REGIONS.map((region) => {
        const active = isSelected(region.code);
        return (
          <Pressable
            key={region.code}
            onPress={() => onToggle(region.code)}
            style={({ pressed }) => [
              styles.legendItem,
              active && styles.legendItemActive,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name={active ? "checkbox" : "square-outline"}
              size={rs(16)}
              color={active ? NeoTheme.colors.black : NeoTheme.colors.textMuted}
            />
            <Text style={[styles.legendText, active && styles.legendTextActive]}>
              {region.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  const map =
    SvgRoot && SvgPath ? (
      <View style={styles.mapWrap}>
        <SvgRoot
          width="100%"
          height="100%"
          viewBox={`0 0 ${SERBIA_MAP_WIDTH} ${SERBIA_MAP_HEIGHT}`}
        >
          {SERBIA_REGIONS.map((region) => {
            const active = isSelected(region.code);
            return region.paths.map((path, index) => (
              <SvgPath
                key={`${region.code}-${index}`}
                d={path}
                fill={active ? NeoTheme.colors.lime : "rgba(255,255,255,0.16)"}
                fillOpacity={active ? 0.92 : 1}
                stroke={active ? NeoTheme.colors.limeBorder : NeoTheme.colors.borderStrong}
                strokeWidth={active ? 3 : 2}
                onPress={() => onToggle(region.code)}
              />
            ));
          })}
        </SvgRoot>
      </View>
    ) : null;

  return (
    <View style={styles.container}>
      {map ? <MapErrorBoundary fallback={null}>{map}</MapErrorBoundary> : null}
      {regionList}
      <Text style={styles.hint}>
        {anySelected
          ? "Signal prati oglase samo iz izabranih regiona."
          : "Nije izabran nijedan region - signal prati celu Srbiju."}
      </Text>
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
    width: rs(210),
    height: rs(305),
  },
  legend: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: rs(8),
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: rs(6),
    paddingHorizontal: rs(12),
    paddingVertical: rs(9),
    borderRadius: rs(12),
    borderWidth: 1,
    borderColor: NeoTheme.colors.borderStrong,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  legendItemActive: {
    backgroundColor: NeoTheme.colors.lime,
    borderColor: NeoTheme.colors.lime,
  },
  legendText: {
    color: NeoTheme.colors.textMuted,
    fontSize: rf(13),
    fontFamily: NeoTheme.fonts.medium,
  },
  legendTextActive: {
    color: NeoTheme.colors.black,
    fontFamily: NeoTheme.fonts.bold,
  },
  hint: {
    color: NeoTheme.colors.textDim,
    fontSize: rf(11),
    fontFamily: NeoTheme.fonts.medium,
  },
  pressed: {
    opacity: 0.84,
  },
});
