"use client";
import React, { useState } from "react";
import { styles } from "@/app/styles/pageStyles";
import { CurrentPick } from "@/types";

type SpinnerWheelProps = {
  picks: any[];
  onRandomPickServer: () => Promise<CurrentPick>;
  onPickResolved: (chosen: CurrentPick) => void;
};

export default function SpinnerWheel({
  picks,
  onRandomPickServer,
  onPickResolved,
}: SpinnerWheelProps) {
  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [transitionEnabled, setTransitionEnabled] = useState(true);

  // 1) Build a "weightedArray" where each pick appears 'weight' times
  const weightedArray: (typeof picks)[number][] = [];
  picks.forEach((p) => {
    for (let i = 0; i < p.weight; i++) {
      weightedArray.push(p);
    }
  });

  // If weightedArray is empty => no spinning
  if (weightedArray.length === 0) {
    return (
      <div style={{ textAlign: "center" }}>
        <p>No picks to spin</p>
      </div>
    );
  }

  // 2) Build conic gradient based on weightedArray length
  const n = weightedArray.length;
  const sliceAngle = 360 / n;

  let gradientSegments = "";
  for (let i = 0; i < n; i++) {
    const startAngle = sliceAngle * i;
    const endAngle = sliceAngle * (i + 1);

    let wedgeColor: string;
    if (n % 2 === 0) {
      // EVEN cycle => 2-color
      wedgeColor = i % 2 === 0 ? "#999999" : "#444444";
    } else {
      // ODD cycle => 3-color
      const colors = ["#999999", "#777777", "#555555"];
      wedgeColor = colors[i % 3];
    }

    gradientSegments += `${wedgeColor} ${startAngle}deg ${endAngle}deg`;
    if (i < n - 1) gradientSegments += ", ";
  }

  const conicGradient = `conic-gradient(${gradientSegments})`;

  // 2) Spin logic
  const handleSpin = async () => {
    if (isSpinning) return;
    setIsSpinning(true);

    try {
      // Ask server for random pick
      const chosen = await onRandomPickServer();

      // const idx = picks.findIndex((p) => p.pickId === chosen.pickId);
      // if (idx < 0) {
      //   console.warn("Chosen pick not found in picks array");
      //   setIsSpinning(false);
      //   return;
      // }
      const indices = weightedArray
        .map((wp, index) => (wp.pickId === chosen.pickId ? index : -1))
        .filter((val) => val !== -1);

      if (indices.length === 0) {
        console.warn("Chosen pick not found in weighted array");
        setIsSpinning(false);
        return;
      }
      const idx = indices[0];

      // For wedge i => midAngle
      const midAngle = sliceAngle * idx + sliceAngle / 2;
      // Suppose your pointer is at 180 deg => do 720 + (180 - midAngle)
      const finalAngle = 720 + (180 - midAngle);

      // reset instantly to 0 without transition
      setTransitionEnabled(false);
      setRotation(0);

      // next frame => enable transition => set finalAngle
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
          setRotation(finalAngle);
        });
      });

      setTimeout(() => {
        setIsSpinning(false);
        onPickResolved(chosen);
      }, 1500);
    } catch (error) {
      console.error("Spin error:", error);
      setIsSpinning(false);
    }
  };

  return (
    <div style={{ textAlign: "center" }}>
      {/* Spinner container */}
      <div
        style={{
          margin: "0 auto",
          width: "250px",
          height: "250px",
          borderRadius: "50%",
          border: "4px solid #fff",
          position: "relative",
          overflow: "hidden",
          transition: transitionEnabled
            ? "transform 1.5s cubic-bezier(0.33, 1, 0.68, 1)"
            : "none",
          transform: `rotate(${rotation}deg)`,
          background: conicGradient,
        }}
      >
        {/* wedge text for each item in weightedArray */}
        {weightedArray.map((pick, i) => {
          const midAngle = sliceAngle * i + sliceAngle / 2;
          const maxChars = 8;
          const truncatedTitle =
            pick.title.length > maxChars
              ? pick.title.slice(0, maxChars) + "…"
              : pick.title;

          return (
            <div
              // key={pick.pickId}
              key={`${pick.pickId}-${i}`}
              style={{
                position: "absolute",
                width: "250px",
                height: "250px",
                top: 0,
                left: 0,
                transformOrigin: "125px 125px",
                transform: `rotate(${midAngle}deg)`,
              }}
            >
              <div
                style={{
                  position: "absolute",
                  top: "125px",
                  left: "125px",
                  transform: `translate(-50%, -70px) rotate(${-midAngle}deg)`,
                  transformOrigin: "center center",
                  color: "#fff",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {truncatedTitle}
              </div>
            </div>
          );
        })}
      </div>

      {/* pointer at the bottom */}
      <div
        style={{
          margin: "1rem auto",
          width: 0,
          height: 0,
          borderLeft: "10px solid transparent",
          borderRight: "10px solid transparent",
          borderBottom: "20px solid #71130F",
        }}
      />

      <button
        style={styles.primaryButton}
        onClick={handleSpin}
        disabled={isSpinning || weightedArray.length === 0}
      >
        {isSpinning ? "Spinning..." : "Spin the Wheel"}
      </button>
    </div>
  );
}
