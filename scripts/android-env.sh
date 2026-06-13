#!/usr/bin/env bash
set -euo pipefail

export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export GRADLE_OPTS="${GRADLE_OPTS:--Dorg.gradle.jvmargs=-Xmx4g -XX:MaxMetaspaceSize=1536m -Dfile.encoding=UTF-8}"

required_ndk="${ANDROID_NDK_VERSION:-27.1.12297006}"
required_ndk_home="$ANDROID_HOME/ndk/$required_ndk"

if [[ -z "${ANDROID_NDK_HOME:-}" ]]; then
  export ANDROID_NDK_HOME="$required_ndk_home"
elif [[ "$ANDROID_NDK_HOME" != "$required_ndk_home" ]]; then
  printf 'ANDROID_NDK_HOME must be %s, got %s\n' "$required_ndk_home" "$ANDROID_NDK_HOME" >&2
  exit 1
fi

missing=()
[[ -d "$ANDROID_HOME/platforms/android-36" ]] || missing+=("platforms;android-36")
[[ -d "$ANDROID_HOME/build-tools/36.0.0" ]] || missing+=("build-tools;36.0.0")
[[ -d "$ANDROID_HOME/platform-tools" ]] || missing+=("platform-tools")
[[ -n "${ANDROID_NDK_HOME:-}" && -d "$ANDROID_NDK_HOME" ]] || missing+=("ndk;$required_ndk")

if (( ${#missing[@]} > 0 )); then
  printf 'Missing Android SDK component(s) in %s:\n' "$ANDROID_HOME" >&2
  printf '  %s\n' "${missing[@]}" >&2
  printf 'Install with: sdkmanager --sdk_root="$HOME/Android/Sdk" %s\n' "${missing[*]@Q}" >&2
  exit 1
fi

exec "$@"
