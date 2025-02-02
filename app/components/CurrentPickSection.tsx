// app/components/CurrentPickSection.tsx
"use client";
import React from "react";
import { CurrentPick } from "@/types";
import { styles } from "@/app/styles/pageStyles";
import SpinnerWheel from "./SpinnerWheel";

type Props = {
  currentPick: CurrentPick | null;
  picks: { pickId: number; title: string; genre: string; addedby: string }[];
  onClearPick: () => Promise<void>;
  onRandomPick: () => Promise<void>;
  onSetRandomPick: any;
  onAddCurrentPickToWatched: () => Promise<void>;
};

export default function CurrentPickSection({
  currentPick,
  picks,
  onClearPick,
  onRandomPick,
  onSetRandomPick,
  onAddCurrentPickToWatched,
}: Props) {
  return (
    <div style={{ ...styles.section, ...styles.sectionAlt2 }}>
      <h2 style={styles.sectionTitle}>Current Random Pick</h2>
      {currentPick ? (
        <div style={styles.currentPickBox}>
          <p style={{ margin: 0 }}>
            <strong>{currentPick.title}</strong> ({currentPick.genre})
            <br />
            <em>Added by {currentPick.addedby}</em>
            <br />
            <small>
              Picked at: {new Date(currentPick.chosenAt).toLocaleString()}
            </small>
          </p>
          <button onClick={onClearPick} style={styles.dangerButton}>
            Clear Current Pick
          </button>
          <button
            onClick={onAddCurrentPickToWatched}
            style={styles.primaryButton}
          >
            Add to Watched
          </button>
        </div>
      ) : (
        <p style={{ marginBottom: "1rem" }}>No movie is currently chosen.</p>
      )}
      <SpinnerWheel
        picks={picks}
        onRandomPickServer={async () => {
          // This calls your backend random pick
          // The same logic you used in `handleRandomPick`.
          // For example:
          const res = await fetch("/api/currentPick", { method: "POST" });
          if (!res.ok) throw new Error("Random pick error");
          const data = await res.json();
          // data is { pickId, movieId, title, ... }
          return data;
        }}
        onPickResolved={(chosen) => {
          // This is where you set your "currentPick" in the parent
          onSetRandomPick(chosen);
        }}
      />

      {/* <button onClick={onRandomPick} style={styles.primaryButton}>Pick a Random Movie</button> */}
    </div>
  );
}
