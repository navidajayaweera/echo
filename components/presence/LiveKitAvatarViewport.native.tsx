import { StyleSheet } from 'react-native';

import {
  LiveKitAvatarViewportShared,
  type LiveKitAvatarViewportProps,
} from './LiveKitAvatarViewport.shared';

function LiveKitVideoLayer({ videoTrack }: { videoTrack: unknown }) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { VideoView } = require('@livekit/react-native') as typeof import('@livekit/react-native');
  return (
    <VideoView
      style={styles.video}
      videoTrack={videoTrack as Parameters<typeof VideoView>[0]['videoTrack']}
      objectFit="cover"
    />
  );
}

export function LiveKitAvatarViewport(props: LiveKitAvatarViewportProps) {
  const videoSlot =
    props.remoteVideoTrack != null ? (
      <LiveKitVideoLayer videoTrack={props.remoteVideoTrack} />
    ) : null;

  return <LiveKitAvatarViewportShared {...props} videoSlot={videoSlot} />;
}

const styles = StyleSheet.create({
  video: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 24,
  },
});
