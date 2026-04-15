// components/ExtensionCleanup.tsx
"use client";

import { useEffect } from "react";

export function ExtensionCleanup() {
  useEffect(() => {
    const removeFdAttributes = () => {
      document.querySelectorAll("[fdprocessedid]").forEach((el) => {
        el.removeAttribute("fdprocessedid");
      });
    };

    removeFdAttributes();
    const timer = setTimeout(removeFdAttributes, 100);

    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((node) => {
          if (node instanceof Element) {
            if (node.hasAttribute("fdprocessedid")) {
              node.removeAttribute("fdprocessedid");
            }
            node.querySelectorAll("[fdprocessedid]").forEach((el) => {
              el.removeAttribute("fdprocessedid");
            });
          }
        });
      });
    });

    observer.observe(document.body, { childList: true, subtree: true });

    return () => {
      clearTimeout(timer);
      observer.disconnect();
    };
  }, []);

  return null;
}
