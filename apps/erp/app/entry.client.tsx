import workerSrc from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { Fragment, startTransition, useEffect } from "react";
import { pdfjs } from "react-pdf";

pdfjs.GlobalWorkerOptions.workerSrc = workerSrc;

import { POSTHOG_API_HOST, POSTHOG_PROJECT_PUBLIC_KEY } from "@carbon/auth";
import { ensureLoggingConfigured } from "@carbon/logger/config.client";
import posthog from "posthog-js";
import { hydrateRoot } from "react-dom/client";
import { HydratedRouter } from "react-router/dom";

ensureLoggingConfigured();

// The project key is what enables analytics: it is unset in local development
// and set by the deployment. A hostname check can't stand in for that, since
// `crbn up` serves the app from *.dev rather than localhost.
function PosthogInit() {
  useEffect(() => {
    if (!POSTHOG_PROJECT_PUBLIC_KEY) return;

    posthog.init(POSTHOG_PROJECT_PUBLIC_KEY, {
      api_host: POSTHOG_API_HOST
    });
  }, []);
  return null;
}

startTransition(() => {
  hydrateRoot(
    document,
    <Fragment>
      <HydratedRouter />
      <PosthogInit />
    </Fragment>
  );
});
