import NetInfo from '@react-native-community/netinfo';

export function isNetworkOnline(state) {
  if (!state?.isConnected) return false;
  if (state.isInternetReachable === false) return false;
  return true;
}

export async function getIsOnline() {
  const state = await NetInfo.fetch();
  return isNetworkOnline(state);
}

export function subscribeNetwork(onOnlineChange) {
  return NetInfo.addEventListener((state) => {
    onOnlineChange(isNetworkOnline(state));
  });
}
