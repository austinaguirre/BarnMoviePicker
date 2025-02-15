// app/components/SignInSignUpForms.tsx

"use client";
import React, { useState } from "react";
import { styles } from "@/app/styles/pageStyles";

type Props = {
  onSignIn: () => void;
  onSignUp: () => void;
  signInUser: { username: string; password: string };
  setSignInUser: React.Dispatch<
    React.SetStateAction<{ username: string; password: string }>
  >;
  signUpUser: { username: string; password: string; group: string };
  setSignUpUser: React.Dispatch<
    React.SetStateAction<{ username: string; password: string; group: string }>
  >;
  signInError: string;
  signUpError: string;

  onCreateGroup: (groupName: string) => void;
};

export default function SignInSignUpForms(props: Props) {
  const {
    onSignIn,
    onSignUp,
    signInUser,
    setSignInUser,
    signUpUser,
    setSignUpUser,
    signInError,
    signUpError,
    onCreateGroup,
  } = props;

  const [newGroupName, setNewGroupName] = useState("");

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Welcome to Barn Movie Picker</h1>
      <p style={styles.subtitle}>Please sign in or sign up to continue.</p>

      {/* Sign In Form */}
      <div style={styles.formCard}>
        <h2 style={styles.formHeader}>Sign In</h2>
        <div style={styles.inputGroup}>
          <input
            style={styles.input}
            placeholder="Username"
            value={signInUser.username}
            onChange={(e) =>
              setSignInUser({ ...signInUser, username: e.target.value })
            }
          />
          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={signInUser.password}
            onChange={(e) =>
              setSignInUser({ ...signInUser, password: e.target.value })
            }
          />
          <button onClick={onSignIn} style={styles.primaryButton}>
            Sign In
          </button>
          {signInError && (
            <p style={{ color: "red", marginTop: 5 }}>{signInError}</p>
          )}
        </div>
      </div>

      {/* Sign Up Form */}
      <div style={styles.formCard}>
        <h2 style={styles.formHeader}>Sign Up</h2>
        <div style={styles.inputGroup}>
          <input
            style={styles.input}
            placeholder="Username"
            value={signUpUser.username}
            onChange={(e) =>
              setSignUpUser({ ...signUpUser, username: e.target.value })
            }
          />
          <input
            style={styles.input}
            placeholder="Password"
            type="password"
            value={signUpUser.password}
            onChange={(e) =>
              setSignUpUser({ ...signUpUser, password: e.target.value })
            }
          />
          <input
            style={styles.input}
            placeholder="Group"
            value={signUpUser.group}
            onChange={(e) =>
              setSignUpUser({ ...signUpUser, group: e.target.value })
            }
          />
          <button onClick={onSignUp} style={styles.primaryButton}>
            Sign Up
          </button>
          {signUpError && (
            <p style={{ color: "red", marginTop: 5 }}>{signUpError}</p>
          )}
        </div>
      </div>

      {/* "Create Group" section */}
      <div style={styles.formCard}>
        <h2 style={styles.formHeader}>Create Movie Group</h2>
        <div style={styles.inputGroup}>
          <input
            style={styles.input}
            placeholder="Group Name"
            value={newGroupName}
            onChange={(e) => setNewGroupName(e.target.value)}
          />
          <button
            style={styles.primaryButton}
            onClick={() => {
              if (!newGroupName.trim()) {
                return;
              }
              onCreateGroup(newGroupName.trim());
              setNewGroupName("");
            }}
          >
            Create Group
          </button>
        </div>
      </div>
    </div>
  );
}
