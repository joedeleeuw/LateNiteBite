// generated from assets/source/mark.svg
import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Stop,
} from "react-native-svg";

type MarkProps = {
  width?: number;
  height?: number;
};

function GlowShapes() {
  return (
    <>
      <Defs>
        <RadialGradient id="bulbGlow" cx="0.5" cy="0.46" r="0.5">
          <Stop offset="0%" stopColor="#FFB84D" stopOpacity="0.34" />
          <Stop offset="45%" stopColor="#FFB84D" stopOpacity="0.16" />
          <Stop offset="100%" stopColor="#FFB84D" stopOpacity="0" />
        </RadialGradient>
      </Defs>
      <Circle cx="100" cy="110" r="100" fill="url(#bulbGlow)" />
    </>
  );
}

function BodyShapes() {
  return (
    <>
      <Circle cx="100" cy="110" r="42" fill="#FFB84D" />
      <Circle cx="100" cy="112" r="33" fill="#E89A3C" opacity="0.45" />
      <Path d="M108 62 C115 61 120 63 124 66 C137 74 140 90 136 108 C133 124 126 140 116 152 C113 156 110 159 106 161" stroke="#C2641E" strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M106 161 C99 165 92 168 87 171" stroke="#C2641E" strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M83 146 C87 156 113 156 117 146 L114 163 L86 163 Z" fill="#E89A3C" />
      <Path d="M82 164 h36 a4.5 4.5 0 0 1 0 9 h-36 a4.5 4.5 0 0 1 0 -9 Z" fill="#22324E" />
      <Path d="M83 175 h34 a4.5 4.5 0 0 1 0 9 h-34 a4.5 4.5 0 0 1 0 -9 Z" fill="#22324E" />
      <Path d="M87 171 C95 176 106 177 112 181 C114 184 112 188 108 190 C105 191.5 101 192 98 191.5" stroke="#C2641E" strokeWidth="3.5" strokeLinecap="round" />
      <Path d="M85 186 h30 a4.5 4.5 0 0 1 0 9 h-30 a4.5 4.5 0 0 1 0 -9 Z" fill="#22324E" />
      <Path d="M89 197 L111 197 L105 208 L97 208 Z" fill="#22324E" />
      <Circle cx="100" cy="211" r="3" fill="#22324E" />
    </>
  );
}

function SheenShapes() {
  return (
    <>
      <Ellipse cx="86" cy="94" rx="6" ry="10" fill="#F2E9DA" opacity="0.35" transform="rotate(-18 86 94)" />
    </>
  );
}

function MouseShapes() {
  return (
    <>
      <Path d="M85 60 C85 54 91 50.5 99 50.5 C107 50.5 113.5 54.5 114.5 59.5 C115.2 63 112.5 66 108 67.2 C102 68.8 92 68 87.5 65.5 C85.5 64.2 85 62.3 85 60 Z" fill="#C2641E" />
      <Circle cx="91.5" cy="52.5" r="4" fill="#C2641E" />
      <Circle cx="91.5" cy="52.5" r="2" fill="#E89A3C" />
      <Path d="M86 58.5 q2.6 2 5.2 0" stroke="#5C2E0F" strokeWidth="1.4" strokeLinecap="round" fill="none" />
      <Circle cx="84" cy="61" r="1.4" fill="#5C2E0F" />
      <Ellipse cx="94" cy="66.5" rx="3.5" ry="1.8" fill="#5C2E0F" opacity="0.45" />
    </>
  );
}

export function BulbGlow({ width = 200, height = 300 }: MarkProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 300" fill="none">
      <GlowShapes />
    </Svg>
  );
}

export function BulbBody({ width = 200, height = 300 }: MarkProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 300" fill="none">
      <BodyShapes />
    </Svg>
  );
}

export function SheenLayer({ width = 200, height = 300 }: MarkProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 300" fill="none">
      <SheenShapes />
    </Svg>
  );
}

export function MouseLayer({ width = 200, height = 300 }: MarkProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 300" fill="none">
      <MouseShapes />
    </Svg>
  );
}

export function BulbMark({ width = 200, height = 300 }: MarkProps) {
  return (
    <Svg width={width} height={height} viewBox="0 0 200 300" fill="none">
      <GlowShapes />
      <BodyShapes />
      <SheenShapes />
      <MouseShapes />
    </Svg>
  );
}
