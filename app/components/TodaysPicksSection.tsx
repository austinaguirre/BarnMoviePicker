"use client";
import React from "react";
import { styles } from "@/app/styles/pageStyles";
import { TodayPick, CurrentPick } from "@/types";

type Props = {
  picks: TodayPick[];
  currentPick: CurrentPick | null;
  handleRemovePick: (pickId: number, bypass: number) => Promise<void>;
  handleClearAllPicks: () => Promise<void>;
};

export default function TodaysPicksSection({
  picks,
  currentPick,
  handleRemovePick,
  handleClearAllPicks,
}: Props) {
  return (
    <div style={{ ...styles.section, ...styles.sectionAlt }}>
      <h2 style={styles.sectionTitle}>Today's Picks</h2>

      <ul style={styles.list}>
        {picks.map((pick) => {
          const isCurrentPick = currentPick?.pickId === pick.pickId;
          return (
            <li key={pick.pickId} style={styles.listItem}>
              <div>
                <strong>{pick.title}</strong> ({pick.genre})
                <br />
                <em style={{ fontSize: "0.9rem" }}>Added by {pick.addedby}</em>
              </div>
              <div style={styles.itemActions}>
                {isCurrentPick ? (
                  <button style={styles.dangerSmallButton} disabled>
                    Current
                  </button>
                ) : (
                  <button
                    style={styles.dangerSmallButton}
                    onClick={() => handleRemovePick(pick.pickId, 0)}
                  >
                    Remove
                  </button>
                )}
              </div>
            </li>
          );
        })}
      </ul>

      <button style={styles.dangerButton} onClick={handleClearAllPicks}>
        Clear All Today's Picks
      </button>
    </div>
  );
}
