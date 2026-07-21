"use client";

import { createContext, useContext, useState, type ReactNode } from "react";

export interface Artifact {
  html: string;
  title: string;
}

interface ArtifactContextValue {
  artifact: Artifact | null;
  openArtifact: (a: Artifact) => void;
  closeArtifact: () => void;
}

const ArtifactContext = createContext<ArtifactContextValue | null>(null);

/** Scope theo ChatPanel — cho phép HtmlCodeCard (lồng sâu trong MessageList)
 * yêu cầu ArtifactPanel (anh em cùng cấp ChatPanel) mở preview mà không cần
 * prop-drill qua nhiều tầng component. */
export function ArtifactProvider({ children }: { children: ReactNode }) {
  const [artifact, setArtifact] = useState<Artifact | null>(null);
  return (
    <ArtifactContext.Provider
      value={{
        artifact,
        openArtifact: setArtifact,
        closeArtifact: () => setArtifact(null),
      }}
    >
      {children}
    </ArtifactContext.Provider>
  );
}

export function useArtifact(): ArtifactContextValue {
  const ctx = useContext(ArtifactContext);
  if (!ctx) throw new Error("useArtifact must be used within ArtifactProvider");
  return ctx;
}
