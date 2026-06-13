#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

export ANDROID_HOME="${ANDROID_HOME:-/usr/lib/android-sdk}"
export ANDROID_SDK_ROOT="${ANDROID_SDK_ROOT:-$ANDROID_HOME}"
export PATH="$PATH:$HOME/.maestro/bin:$ANDROID_HOME/emulator:$ANDROID_HOME/platform-tools:$ANDROID_HOME/cmdline-tools/13.0/bin:$ANDROID_HOME/cmdline-tools/latest/bin"
export MAESTRO_CLI_NO_ANALYTICS="${MAESTRO_CLI_NO_ANALYTICS:-1}"
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED="${MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED:-true}"

AVD_NAME="${LNB_ANDROID_AVD:-latenitebite_smoke_api34}"
AVD_PACKAGE="${LNB_ANDROID_AVD_PACKAGE:-system-images;android-34;default;x86_64}"
AVD_DEVICE="${LNB_ANDROID_AVD_DEVICE:-pixel_5}"
APP_ID="${APP_ID:-com.joedeleeuw.latenitebite}"
EMULATOR_LOG="${LNB_ANDROID_EMULATOR_LOG:-/tmp/latenitebite-android-emulator.log}"
KEEP_EMULATOR="${LNB_KEEP_EMULATOR:-0}"
BOOT_TIMEOUT_SEC="${LNB_ANDROID_BOOT_TIMEOUT_SEC:-360}"
ALLOW_UNINSTALLED="${LNB_ALLOW_UNINSTALLED:-0}"
EMULATOR_ACCEL="${LNB_ANDROID_EMULATOR_ACCEL:-auto}"
METRO_PORT="${LNB_ANDROID_METRO_PORT:-8081}"

usage() {
  cat <<EOF
Usage:
  scripts/smoke-android.sh --doctor
  scripts/smoke-android.sh [maestro-flow.yaml ...]

Environment:
  APP_ID                      Android app id (default: $APP_ID)
  LNB_ANDROID_AVD             AVD name (default: $AVD_NAME)
  LNB_ANDROID_EMULATOR_ACCEL  auto|off|on (default: $EMULATOR_ACCEL)
  LNB_ANDROID_METRO_PORT      Reverse Metro port for dev builds (default: $METRO_PORT)
  LNB_KEEP_EMULATOR=1         Leave emulator running after tests
  LNB_ALLOW_UNINSTALLED=1     Skip installed-app preflight
EOF
}

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing required command: $1" >&2
    exit 127
  fi
}

android_device_ready() {
  adb devices | awk 'NR > 1 && $2 == "device" { found = 1 } END { exit(found ? 0 : 1) }'
}

ensure_avd() {
  if avdmanager list avd | grep -q "Name: ${AVD_NAME}$"; then
    return
  fi

  printf "creating Android AVD %s\n" "$AVD_NAME"
  printf "no\n" | avdmanager create avd \
    --force \
    --name "$AVD_NAME" \
    --package "$AVD_PACKAGE" \
    --device "$AVD_DEVICE"
}

start_emulator_if_needed() {
  if android_device_ready; then
    return
  fi

  ensure_avd
  printf "starting Android emulator %s\n" "$AVD_NAME"
  nohup emulator \
    -avd "$AVD_NAME" \
    -no-window \
    -no-audio \
    -no-boot-anim \
    -gpu swiftshader_indirect \
    -accel "$EMULATOR_ACCEL" \
    -no-snapshot \
    -ports 5554,5555 \
    >"$EMULATOR_LOG" 2>&1 &
  EMULATOR_PID="$!"
}

wait_for_android() {
  adb start-server >/dev/null
  local deadline=$((SECONDS + BOOT_TIMEOUT_SEC))
  while (( SECONDS < deadline )); do
    local state
    local booted
    state="$(adb get-state 2>/dev/null || true)"
    booted="$(adb shell getprop sys.boot_completed 2>/dev/null | tr -d '\r' || true)"
    if [[ "$state" == "device" && "$booted" == "1" ]]; then
      adb shell input keyevent 82 >/dev/null 2>&1 || true
      adb devices -l
      return
    fi
    sleep 2
  done

  echo "Android emulator did not boot within ${BOOT_TIMEOUT_SEC}s" >&2
  echo "emulator log: $EMULATOR_LOG" >&2
  adb devices -l >&2 || true
  exit 1
}

ensure_app_installed() {
  if [[ "$ALLOW_UNINSTALLED" == "1" ]]; then
    return
  fi

  if adb shell pm path "$APP_ID" >/dev/null 2>&1; then
    return
  fi

  cat >&2 <<EOF
Android app is not installed on the active device: $APP_ID

Build and install it first, with Sentry configured for the bundle:
  EXPO_PUBLIC_SENTRY_DSN=https://public@example.invalid/1 pnpm android

Then rerun:
  pnpm smoke:android

To skip this preflight:
  LNB_ALLOW_UNINSTALLED=1 pnpm smoke:android
EOF
  exit 1
}

doctor() {
  need adb
  need emulator
  need avdmanager
  need maestro
  printf "maestro: "
  maestro --version
  adb version | sed -n '1,3p'
  timeout 10 emulator -version | sed -n '1,2p' || true
  sdkmanager --list_installed | sed -n '1,80p' || true
  timeout 30 maestro list-devices || true
}

if [[ "${1:-}" == "--help" || "${1:-}" == "-h" ]]; then
  usage
  exit 0
fi

if [[ "${1:-}" == "--doctor" ]]; then
  doctor
  exit 0
fi

need adb
need emulator
need avdmanager
need maestro

cd "$REPO_ROOT"

if [[ $# -eq 0 ]]; then
  set -- .maestro/android-location-required.yaml
fi

EMULATOR_PID=""
cleanup() {
  if [[ -n "$EMULATOR_PID" && "$KEEP_EMULATOR" != "1" ]]; then
    adb -s emulator-5554 emu kill >/dev/null 2>&1 || kill "$EMULATOR_PID" >/dev/null 2>&1 || true
  fi
}
trap cleanup EXIT

start_emulator_if_needed
wait_for_android
ensure_app_installed

adb reverse "tcp:${METRO_PORT}" "tcp:${METRO_PORT}" >/dev/null 2>&1 || true
if [[ "$METRO_PORT" != "8081" ]]; then
  adb reverse "tcp:8081" "tcp:${METRO_PORT}" >/dev/null 2>&1 || true
fi

APP_ID="$APP_ID" maestro test -p android "$@"
