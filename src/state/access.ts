import { safeUrl } from '../config/site';
import { TRACK_IDS, type Progress, type Reward } from '../data/models';

export interface RewardAccess {
  published: boolean;
  unlocked: boolean;
  canDownload: boolean;
  reason: 'available' | 'unpublished' | 'locked';
}

/** Editorial publication and access are independent; NFC is never a gameplay victory. */
export function getAccess(reward: Reward, progress: Progress): RewardAccess {
  const published = reward.published && safeUrl(reward.url, true) !== null;
  const gameplayUnlocked = reward.requiredLevelId !== null
    ? progress.completedLevelIds.includes(reward.requiredLevelId)
    : reward.trackId !== null
      ? progress.unlockedTrackIds.includes(reward.trackId)
      : TRACK_IDS.every((id) => progress.unlockedTrackIds.includes(id));
  const unlocked = progress.nfcUnlocked || gameplayUnlocked;
  const canDownload = published && unlocked;
  return { published, unlocked, canDownload, reason: !published ? 'unpublished' : unlocked ? 'available' : 'locked' };
}
