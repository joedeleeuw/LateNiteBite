import Svg, {
  Circle,
  Defs,
  Ellipse,
  Path,
  RadialGradient,
  Rect,
  Stop,
} from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Link, Pressable, Text, View } from "@/tw";

function MissingPlaceScene() {
  return (
    <View className="w-full items-center">
      <Svg width="100%" height={300} viewBox="0 0 320 360" fill="none">
        <Defs>
          <RadialGradient id="missingGlow" cx="0.5" cy="0.43" r="0.44">
            <Stop offset="0%" stopColor="#FFB84D" stopOpacity="0.58" />
            <Stop offset="48%" stopColor="#FFB84D" stopOpacity="0.18" />
            <Stop offset="100%" stopColor="#FFB84D" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Rect width={320} height={360} rx={30} fill="#07101D" />
        <Circle cx={160} cy={148} r={142} fill="url(#missingGlow)" />
        <Circle cx={64} cy={78} r={1.5} fill="#FFB84D" opacity={0.76} />
        <Circle cx={247} cy={50} r={1.6} fill="#FFB84D" opacity={0.82} />
        <Circle cx={272} cy={118} r={1.7} fill="#FFB84D" opacity={0.7} />
        <Circle cx={82} cy={157} r={1.2} fill="#FFB84D" opacity={0.64} />
        <Rect x={24} y={48} width={18} height={152} rx={7} fill="#121B2D" />
        <Path
          d="M28 80 H292 C300 80 306 85 306 92 C306 99 300 104 292 104 H28 C20 104 14 99 14 92 C14 85 20 80 28 80 Z"
          fill="#172238"
        />
        <Path
          d="M28 96 C86 87 144 89 292 96"
          stroke="#22324E"
          strokeWidth={3}
          strokeLinecap="round"
        />
        <Path
          d="M159 98 C159 119 159 132 159 151"
          stroke="#5C2E0F"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Path
          d="M140 148 H179 C187 148 192 153 192 161 V171 H128 V161 C128 153 133 148 140 148 Z"
          fill="#172238"
        />
        <Circle cx={160} cy={205} r={44} fill="#FFB84D" />
        <Circle cx={160} cy={208} r={34} fill="#E89A3C" opacity={0.52} />
        <Ellipse
          cx={145}
          cy={190}
          rx={7}
          ry={14}
          fill="#F2E9DA"
          opacity={0.34}
          transform="rotate(-18 145 190)"
        />
        <Path
          d="M143 237 C151 247 171 247 178 237 L175 256 H145 Z"
          fill="#E89A3C"
        />
        <Path d="M143 258 H177" stroke="#172238" strokeWidth={10} strokeLinecap="round" />
        <Path d="M147 272 H173" stroke="#172238" strokeWidth={10} strokeLinecap="round" />
        <Path d="M151 284 H169 L164 296 H156 Z" fill="#172238" />
        <Circle cx={160} cy={300} r={3} fill="#172238" />
        <Path
          d="M82 80 C76 68 86 61 101 64 C109 66 116 72 119 80"
          stroke="#C2641E"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Path
          d="M82 73 C82 65 90 60 101 60 C113 60 122 66 123 74 C124 79 119 84 112 85 C101 87 87 84 83 80 C82 78 82 76 82 73 Z"
          fill="#C2641E"
        />
        <Circle cx={93} cy={62} r={6} fill="#C2641E" />
        <Circle cx={93} cy={62} r={2.8} fill="#E89A3C" />
        <Path
          d="M84 72 q3.2 2.6 6.8 0"
          stroke="#5C2E0F"
          strokeWidth={1.6}
          strokeLinecap="round"
        />
        <Circle cx={80} cy={76} r={1.6} fill="#5C2E0F" />
        <Path
          d="M0 286 C44 270 75 273 118 291 C171 313 220 310 320 276 V360 H0 Z"
          fill="#111929"
        />
        <Path
          d="M18 288 C75 272 116 279 159 302 C204 325 251 317 304 292"
          stroke="#22324E"
          strokeWidth={4}
          strokeLinecap="round"
        />
        <Path
          d="M222 221 C238 209 256 209 271 224"
          stroke="#BA6E0C"
          strokeWidth={6}
          strokeLinecap="round"
        />
        <Path
          d="M48 230 C66 215 86 216 102 232"
          stroke="#BA6E0C"
          strokeWidth={6}
          strokeLinecap="round"
        />
        <Path d="M229 244 H277" stroke="#F2E9DA" strokeWidth={5} strokeLinecap="round" />
        <Path d="M40 253 H92" stroke="#F2E9DA" strokeWidth={5} strokeLinecap="round" />
      </Svg>
      <Text className="-mt-28 text-[72px] font-bold leading-[80px] text-[#FFB84D]">
        404
      </Text>
    </View>
  );
}

export function MissingPlaceState({ testID }: { testID: string }) {
  const insets = useSafeAreaInsets();

  return (
    <View
      className="flex-1 px-5"
      style={{
        backgroundColor: "#0A101C",
        paddingBottom: insets.bottom + 16,
        paddingTop: insets.top + 16,
      }}
      testID={testID}
    >
      <View className="w-full max-w-[430px] flex-1 self-center">
        <View className="mb-6 self-start">
          <Link href="/" asChild>
            <Pressable
              className="border-b border-[#F2E9DA]/20 py-2"
              testID="lnb_back_button"
            >
              <Text className="text-sm text-[#B2BED0]">back</Text>
            </Pressable>
          </Link>
        </View>
        <View className="flex-1 justify-center gap-7 pb-12">
          <MissingPlaceScene />
          <View className="gap-3">
            <Text className="text-3xl font-semibold leading-9 text-[#ECF0F7]" selectable>
              place slipped away
            </Text>
            <Text className="text-base leading-6 text-[#B2BED0]" selectable>
              {"it may have closed, moved, or fallen off tonight's list."}
            </Text>
          </View>
          <Link href="/" asChild>
            <Pressable className="items-center rounded-full bg-[#FFB84D] px-5 py-4">
              <Text className="text-base font-semibold text-[#0A101C]">
                back to open spots
              </Text>
            </Pressable>
          </Link>
        </View>
      </View>
    </View>
  );
}
