/**
 * ChessMaster Cloud Functions (2nd gen).
 *
 * Triggers:
 *  - syncPublicProfile   mirror public user fields into /publicProfiles
 *  - onUserProfileCreated welcome notification
 *  - rateCompletedGame   Elo for every rated finished game (idempotent)
 *  - submitGameResult    trusted writer for online game results
 *  - deleteAccount       full account wipe (data + auth)
 *  - cleanupLiveGames    scheduled housekeeping for the Realtime Database
 */

import { setGlobalOptions } from "firebase-functions";

// Cap instances so a traffic spike can't run away with the billing.
setGlobalOptions({ maxInstances: 10, region: "us-central1" });

export { syncPublicProfile } from "./profiles";
export { onUserProfileCreated, deleteAccount } from "./account";
export { rateCompletedGame, submitGameResult } from "./games";
export { cleanupLiveGames } from "./cleanup";

