"use client";

import Link from "next/link";

export function ErrorState({
  message,
  onRetry,
  retryHref,
}: {
  message: string;
  onRetry?: () => void;
  retryHref?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-lg border border-red-200 bg-red-50 p-8 text-center dark:border-red-900 dark:bg-red-950/30">
      <p className="text-red-700 dark:text-red-400">{message}</p>
      {(onRetry || retryHref) && (
        onRetry ? (
          <button
            onClick={onRetry}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black"
          >
            Tentar novamente
          </button>
        ) : (
          <Link
            href={retryHref!}
            className="rounded-md bg-black px-4 py-2 text-sm font-medium text-white hover:bg-neutral-800 dark:bg-white dark:text-black"
          >
            Tentar novamente
          </Link>
        )
      )}
    </div>
  );
}
