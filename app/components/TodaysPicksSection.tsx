"use client";
import React from "react";
import { styles } from "@/app/styles/pageStyles";
import { TodayPick, CurrentPick } from "@/types";

type Props = {
  picks: TodayPick[];
  currentPick: CurrentPick | null;
  handleRemovePick: (pickId: number, bypass: number) => Promise<void>;
  handleClearAllPicks: () => Promise<void>;
  userHasPick: boolean;
  onUpvotePick: (pickId: number) => Promise<void>;
  userName: any;
  handleRemoveUpvote: (pickId: number) => Promise<void>;
};

export default function TodaysPicksSection({
  picks,
  currentPick,
  handleRemovePick,
  handleClearAllPicks,
  userHasPick,
  onUpvotePick,
  userName,
  handleRemoveUpvote,
}: Props) {
  return (
    <div style={{ ...styles.section, ...styles.sectionAlt }}>
      <h2 style={styles.sectionTitle}>Today's Picks</h2>

      <ul style={styles.list}>
        {picks.map((pick) => {
          const isCurrentPick = currentPick?.pickId === pick.pickId;

          let hasVoters = false;
          if (pick?.upvoters.length > 0) {
            hasVoters = true;
          }
          const userUpvotedThis = pick.upvoters.includes(userName);
          const userHasVoted = picks.some((p) => p.upvoters.includes(userName));
          return (
            <li key={pick.pickId} style={styles.listItem}>
              <div>
                <strong>{pick.title}</strong> ({pick.genre})
                <br />
                <em style={{ fontSize: "0.9rem" }}>Added by {pick.addedby}</em>
                <br />
                <em style={{ fontSize: "0.9rem" }}>Picked by {pick.pickedBy}</em>
                {hasVoters ? (
                  <p style={{ fontSize: "0.8rem", color: "#666" }}>
                    Upvoted by: {pick.upvoters.join(", ")}
                  </p>
                ) : (
                  <div></div>
                )}
              </div>
              <div style={styles.itemActions}>
                {isCurrentPick ? (
                  <button style={styles.pickedSmallButton} disabled>
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
                {userUpvotedThis ? (
                  // CASE 1: The user has upvoted THIS pick => Show Remove Upvote
                  <button
                    style={styles.primarySmallButton}
                    onClick={() => handleRemoveUpvote(pick.pickId)}
                  >
                    Remove Upvote
                  </button>
                ) : userHasVoted ? // CASE 2: The user upvoted a DIFFERENT pick => No button
                null : (
                  // CASE 3: The user hasn't upvoted ANY pick => Show Upvote button
                  <button
                    style={styles.primarySmallButton}
                    onClick={() => onUpvotePick(pick.pickId)}
                    disabled={userHasPick}
                  >
                    Upvote
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
