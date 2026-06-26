import { useId } from "react";
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  LinearGradient,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";

export function NightBulbScene({
  compact = false,
  mouse = false,
}: {
  compact?: boolean;
  mouse?: boolean;
}) {
  const id = useId().replace(/[^A-Za-z0-9_-]/g, "");
  const glowId = `nightBulbGlow${id}`;
  const skyId = `nightSky${id}`;
  const glassId = `glassSweep${id}`;

  return (
    <Svg
      width="100%"
      height="100%"
      viewBox="0 0 320 320"
      fill="none"
      preserveAspectRatio="xMidYMid slice"
    >
      <Defs>
        <RadialGradient id={glowId} cx="0.5" cy="0.42" r="0.54">
          <Stop offset="0%" stopColor="#FFB84D" stopOpacity="0.42" />
          <Stop offset="40%" stopColor="#FFB84D" stopOpacity="0.14" />
          <Stop offset="100%" stopColor="#FFB84D" stopOpacity="0" />
        </RadialGradient>
        <LinearGradient id={skyId} x1="0" x2="0" y1="0" y2="320">
          <Stop offset="0%" stopColor="#06101F" />
          <Stop offset="58%" stopColor="#0A101C" />
          <Stop offset="100%" stopColor="#07101B" />
        </LinearGradient>
        <LinearGradient id={glassId} x1="26" x2="286" y1="0" y2="320">
          <Stop offset="0%" stopColor="#F2E9DA" stopOpacity="0.06" />
          <Stop offset="36%" stopColor="#F2E9DA" stopOpacity="0.02" />
          <Stop offset="100%" stopColor="#F2E9DA" stopOpacity="0" />
        </LinearGradient>
      </Defs>
      <Rect width={320} height={320} fill={`url(#${skyId})`} />
      <Circle cx={160} cy={142} r={132} fill={`url(#${glowId})`} />
      <G opacity={0.86}>
        <Circle cx={56} cy={66} r={1.4} fill="#FFB84D" />
        <Circle cx={245} cy={48} r={1.7} fill="#FFB84D" />
        <Circle cx={276} cy={112} r={1.4} fill="#FFB84D" />
        <Circle cx={90} cy={156} r={1.1} fill="#FFB84D" />
        <Circle cx={222} cy={196} r={1.2} fill="#FFB84D" />
      </G>
      <Rect x={27} y={62} width={18} height={142} rx={7} fill="#111A2B" />
      <Path
        d="M27 91 H292 C301 91 307 96 307 103 C307 110 301 115 292 115 H27 C19 115 13 110 13 103 C13 96 19 91 27 91 Z"
        fill="#152137"
      />
      <Path
        d="M28 106 C94 96 157 101 292 106"
        stroke="#263B5E"
        strokeLinecap="round"
        strokeWidth={3}
      />
      {mouse ? (
        <G>
          <Path
            d="M82 91 C76 78 86 70 102 73 C111 75 118 82 121 91"
            stroke="#C96E21"
            strokeLinecap="round"
            strokeWidth={4}
          />
          <Path
            d="M82 84 C82 75 91 70 103 70 C116 70 125 77 126 85 C127 91 121 95 113 96 C101 98 87 94 83 90 C82 88 82 86 82 84 Z"
            fill="#C96E21"
          />
          <Circle cx={94} cy={72} r={6} fill="#C96E21" />
          <Circle cx={94} cy={72} r={2.8} fill="#E9A148" />
          <Path
            d="M84 84 q3.2 2.6 6.8 0"
            stroke="#5C2E0F"
            strokeLinecap="round"
            strokeWidth={1.6}
          />
          <Circle cx={80} cy={87} r={1.6} fill="#5C2E0F" />
        </G>
      ) : null}
      <Path
        d="M160 113 C160 133 160 146 160 166"
        stroke="#5C2E0F"
        strokeLinecap="round"
        strokeWidth={4}
      />
      <Path
        d="M141 162 H180 C188 162 193 167 193 175 V186 H128 V175 C128 167 133 162 141 162 Z"
        fill="#172238"
      />
      <Circle cx={160} cy={218} r={43} fill="#FFB84D" />
      <Circle cx={160} cy={222} r={32} fill="#E89A3C" opacity={0.46} />
      <Ellipse
        cx={145}
        cy={202}
        rx={7}
        ry={14}
        fill="#F2E9DA"
        opacity={0.34}
        transform="rotate(-18 145 202)"
      />
      <Path
        d="M143 249 C151 258 171 258 178 249 L175 267 H145 Z"
        fill="#E89A3C"
      />
      <Path d="M144 270 H176" stroke="#172238" strokeLinecap="round" strokeWidth={9} />
      <Path d="M148 282 H172 L166 294 H155 Z" fill="#172238" />
      <Circle cx={160} cy={300} r={3} fill="#172238" />
      <Path
        d="M0 252 C48 235 83 239 124 256 C176 278 221 275 320 240 V320 H0 Z"
        fill="#101A2D"
      />
      <Path
        d="M20 255 C78 238 118 245 160 266 C204 288 250 280 304 256"
        stroke="#263B5E"
        strokeLinecap="round"
        strokeWidth={4}
      />
      {!compact ? (
        <G opacity={0.9}>
          <Path
            d="M221 230 C238 217 256 218 272 234"
            stroke="#BA6E0C"
            strokeLinecap="round"
            strokeWidth={6}
          />
          <Path
            d="M48 238 C66 224 86 225 103 241"
            stroke="#BA6E0C"
            strokeLinecap="round"
            strokeWidth={6}
          />
          <Path d="M230 253 H278" stroke="#F2E9DA" strokeLinecap="round" strokeWidth={5} />
          <Path d="M40 262 H92" stroke="#F2E9DA" strokeLinecap="round" strokeWidth={5} />
        </G>
      ) : null}
      <Rect width={320} height={320} fill={`url(#${glassId})`} />
    </Svg>
  );
}
