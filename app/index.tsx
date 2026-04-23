import { router } from "expo-router";
import { useEffect } from "react";
import { getActiveDocumentId, isOnboardingDone } from "@/services/storageService";

export default function Index() {
  useEffect(() => {
    (async () => {
      const onboarded = await isOnboardingDone();
      if (!onboarded) {
        router.replace("/(onboarding)/welcome");
        return;
      }
      const activeId = await getActiveDocumentId();
      if (activeId) {
        router.replace("/(main)/dashboard");
      } else {
        router.replace("/(onboarding)/welcome");
      }
    })();
  }, []);

  return null;
}
