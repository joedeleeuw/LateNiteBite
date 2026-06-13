#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

export PATH="$PATH:$HOME/.maestro/bin"
export MAESTRO_CLI_NO_ANALYTICS="${MAESTRO_CLI_NO_ANALYTICS:-1}"
export MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED="${MAESTRO_CLI_ANALYSIS_NOTIFICATION_DISABLED:-true}"

APP_ID="${APP_ID:-com.joedeleeuw.latenitebite}"
IOS_SIMULATOR_UDID="${LNB_IOS_SIMULATOR_UDID:-}"
IOS_SIMULATOR_NAME="${LNB_IOS_SIMULATOR_NAME:-}"
ALLOW_UNINSTALLED="${LNB_ALLOW_UNINSTALLED:-0}"

usage() {
  cat <<EOF
Usage:
  scripts/smoke-ios.sh --doctor
  scripts/smoke-ios.sh [--simulator UDID_OR_NAME] [maestro-flow.yaml ...]

Environment:
  APP_ID                    iOS bundle id (default: $APP_ID)
  LNB_IOS_SIMULATOR_UDID    Simulator UDID
  LNB_IOS_SIMULATOR_NAME    Simulator name
  LNB_ALLOW_UNINSTALLED=1   Skip installed-app preflight
EOF
}

need() {
  if ! command -v "$1" >/dev/null 2>&1; then
    echo "missing required command: $1" >&2
    exit 127
  fi
}

find_booted_simulator() {
  local simulator
  simulator="$(xcrun simctl list devices booted | awk -F '[()]' '/Booted/ && /iPhone/ { print $2; exit }')"
  [[ -n "$simulator" ]] || return 1
  printf "%s\n" "$simulator"
}

find_available_simulator() {
  local simulator
  if [[ -n "$IOS_SIMULATOR_NAME" ]]; then
    simulator="$(xcrun simctl list devices available | awk -v name="$IOS_SIMULATOR_NAME" -F '[()]' '$0 ~ name && /Shutdown|Booted/ { print $2; exit }')"
    [[ -n "$simulator" ]] || return 1
    printf "%s\n" "$simulator"
    return
  fi

  simulator="$(xcrun simctl list devices available | awk -F '[()]' '/iPhone/ && /Shutdown|Booted/ { print $2; exit }')"
  [[ -n "$simulator" ]] || return 1
  printf "%s\n" "$simulator"
}

resolve_simulator() {
  if [[ -n "$IOS_SIMULATOR_UDID" ]]; then
    printf "%s\n" "$IOS_SIMULATOR_UDID"
    return
  fi

  find_booted_simulator || find_available_simulator
}

ensure_simulator_booted() {
  local simulator="$1"
  xcrun simctl boot "$simulator" >/dev/null 2>&1 || true
  xcrun simctl bootstatus "$simulator" -b
}

ensure_app_installed() {
  local simulator="$1"
  if [[ "$ALLOW_UNINSTALLED" == "1" ]]; then
    return
  fi

  if xcrun simctl get_app_container "$simulator" "$APP_ID" >/dev/null 2>&1; then
    return
  fi

  cat >&2 <<EOF
iOS app is not installed on simulator $simulator: $APP_ID

Build and install it first on the Mac, with Sentry configured for the bundle:
  EXPO_PUBLIC_SENTRY_DSN=https://public@example.invalid/1 pnpm ios

Then rerun:
  pnpm smoke:ios

To skip this preflight:
  LNB_ALLOW_UNINSTALLED=1 pnpm smoke:ios
EOF
  exit 1
}

doctor() {
  need xcrun
  need maestro
  printf "maestro: "
  maestro --version
  xcodebuild -version
  xcrun simctl list devices booted
  local simulator
  simulator="$(resolve_simulator 2>/dev/null || true)"
  printf "selected simulator: %s\n" "${simulator:-<none>}"
  if [[ -n "$simulator" ]]; then
    xcrun simctl get_app_container "$simulator" "$APP_ID" || true
  fi
}

RUN_DOCTOR=0
flows=()

while [[ $# -gt 0 ]]; do
  case "$1" in
    --help|-h)
      usage
      exit 0
      ;;
    --doctor)
      RUN_DOCTOR=1
      shift
      ;;
    --simulator)
      IOS_SIMULATOR_UDID="$2"
      shift 2
      ;;
    --simulator=*)
      IOS_SIMULATOR_UDID="${1#*=}"
      shift
      ;;
    --allow-uninstalled)
      ALLOW_UNINSTALLED=1
      shift
      ;;
    --)
      shift
      flows+=("$@")
      break
      ;;
    *)
      flows+=("$1")
      shift
      ;;
  esac
done

if [[ "$(uname -s)" != "Darwin" ]]; then
  echo "iOS smoke must run on macOS" >&2
  exit 1
fi

need xcrun
need maestro

if [[ "$RUN_DOCTOR" == "1" ]]; then
  doctor
  exit 0
fi

cd "$REPO_ROOT"

if [[ ${#flows[@]} -eq 0 ]]; then
  flows=(.maestro/ios-location-required.yaml)
fi

SIMULATOR="$(resolve_simulator)"
if [[ -z "$SIMULATOR" ]]; then
  echo "no available iPhone simulator found" >&2
  exit 1
fi

ensure_simulator_booted "$SIMULATOR"
ensure_app_installed "$SIMULATOR"

APP_ID="$APP_ID" maestro --platform ios --udid "$SIMULATOR" test "${flows[@]}"
