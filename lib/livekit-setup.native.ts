import Constants from 'expo-constants';

const isExpoGo = Constants.appOwnership === 'expo';

// #region agent log
fetch('http://127.0.0.1:7744/ingest/3aeff884-f869-49e5-b3ca-024823977ed4', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'X-Debug-Session-Id': 'd7c109' },
  body: JSON.stringify({
    sessionId: 'd7c109',
    location: 'lib/livekit-setup.native.ts',
    message: 'livekit-setup module load',
    data: { isExpoGo, appOwnership: Constants.appOwnership },
    timestamp: Date.now(),
    hypothesisId: 'A',
  }),
}).catch(() => {});
// #endregion

if (!isExpoGo) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@livekit/react-native').registerGlobals();
}
