import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

const AMBER = "#FFB84D";
const AMBER_DEEP = "#E89A3C";
const RUST = "#C2641E";
const RUST_DARK = "#5C2E0F";
const SOCKET_NAVY = "#22324E";
const CREAM = "#F2E9DA";
const WOOD = "#4A3424";
const WOOD_GRAIN = "#3A2819";
const WOOD_EDGE = "#2E2014";

type LayerProps = {
  width?: number;
  height?: number;
};

const frame = { viewBox: "0 0 200 300", fill: "none" } as const;

export function VignetteGlow({ width = 200, height = 300 }: LayerProps) {
  return (
    <Svg width={width} height={height} {...frame}>
      <Defs>
        <RadialGradient id="vignetteGlow" cx="0.5" cy="0.5" r="0.5">
          <Stop offset="0%" stopColor={AMBER} stopOpacity="0.4" />
          <Stop offset="45%" stopColor={AMBER} stopOpacity="0.19" />
          <Stop offset="100%" stopColor={AMBER} stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="100" cy="134" r="96" fill="url(#vignetteGlow)" />
    </Svg>
  );
}

export function VignetteBulb({ width = 200, height = 300 }: LayerProps) {
  return (
    <Svg width={width} height={height} {...frame}>
      <Path
        d="M92 79 h16 a2.5 2.5 0 0 1 0 5 h-16 a2.5 2.5 0 0 1 0 -5 Z"
        fill={AMBER_DEEP}
      />
      <Path
        d="M93 86 h14 a2.5 2.5 0 0 1 0 5 h-14 a2.5 2.5 0 0 1 0 -5 Z"
        fill={AMBER_DEEP}
      />
      <Circle cx="100" cy="134" r="42" fill={AMBER} />
      <Circle cx="100" cy="136" r="33" fill={AMBER_DEEP} opacity="0.45" />
      <Ellipse
        cx="86"
        cy="118"
        rx="6"
        ry="10"
        fill={CREAM}
        opacity="0.35"
        transform="rotate(-18 86 118)"
      />
      <Path
        d="M105 79 C113 80 117 86 114 92"
        stroke={RUST}
        strokeWidth="5"
        strokeLinecap="round"
      />
      <Path
        d="M114 92 C111 96 105 97.5 101 97"
        stroke={RUST}
        strokeWidth="4.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function VignetteFixture({ width = 200, height = 300 }: LayerProps) {
  return (
    <Svg width={width} height={height} {...frame}>
      <Rect x="98" y="54" width="4" height="8" fill={SOCKET_NAVY} />
      <Path d="M88 62 L112 62 L109 78 L91 78 Z" fill={SOCKET_NAVY} />
      <Rect x="0" y="28" width="200" height="26" fill={WOOD} />
      <Path d="M0 36 H200" stroke={WOOD_GRAIN} strokeWidth="1.2" opacity="0.7" />
      <Path d="M0 45 H200" stroke={WOOD_GRAIN} strokeWidth="1" opacity="0.5" />
      <Rect x="0" y="52" width="200" height="2" fill={WOOD_EDGE} />
    </Svg>
  );
}

export function VignetteMouse({ width = 200, height = 300 }: LayerProps) {
  return (
    <Svg width={width} height={height} {...frame}>
      <Path
        d="M86 24 C86 14 96 8 108 8 C120 8 128 13 130 20 C131.5 25 128 28 122 28 L94 28 C89 28 86 26.5 86 24 Z"
        fill={RUST}
      />
      <Circle cx="103" cy="8" r="5" fill={RUST} />
      <Circle cx="103" cy="8" r="2.5" fill={AMBER_DEEP} />
      <Path
        d="M93 15.5 q3.2 2.4 6.4 0"
        stroke={RUST_DARK}
        strokeWidth="1.6"
        strokeLinecap="round"
        fill="none"
      />
      <Circle cx="88.5" cy="18.5" r="1.9" fill={RUST_DARK} />
    </Svg>
  );
}

export function VignetteTail({ width = 200, height = 300 }: LayerProps) {
  return (
    <Svg width={width} height={height} {...frame}>
      <Path
        d="M126 26 C132 30 130 38 124 44 C119 49 112 53 108 58 C106.5 60 105.5 62 105 64"
        stroke={RUST}
        strokeWidth="5"
        strokeLinecap="round"
      />
    </Svg>
  );
}
