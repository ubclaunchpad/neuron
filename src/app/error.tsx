"use client";

import { useEffect } from "react";

export default function Error(props: {
  error: Error & { digest?: string };
  reset: () => void; // re-render this segment
}) {
  useEffect(() => {
    // log or send to Sentry here
    console.error(props.error);
  }, [props.error]);

  return (
    <div>
      <h1>Something went wrong.</h1>
    </div>
  );
}
