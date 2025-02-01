"use client";
import React, { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";

type Movie = {
  id: number;
  title: string;
  genre: string;
  addedby: string;
  watched?: boolean;
};

type TodayPick = {
  pickId: number; // the row in todays_picks
  movieId: number; // the actual movie.id
  title: string;
  genre: string;
  addedby: string;
};

type CurrentPick = {
  currentPickId: number;
  pickId: number;
  movieId: number;
  title: string;
  genre: string;
  addedby: string;
  chosenAt: string;
};

export default function Home() {
  const { data: session, status } = useSession();

  const [movies, setMovies] = useState<Movie[]>([]);
  const [picks, setPicks] = useState<TodayPick[]>([]);
  const [currentPick, setCurrentPick] = useState<CurrentPick | null>(null);

  const [newMovie, setNewMovie] = useState({ title: "", genre: "" });

  const [globalError, setGlobalError] = useState("");

  const [showWatched, setShowWatched] = useState(false);

  const [searchTitle, setSearchTitle] = useState("");
  const [searchGenre, setSearchGenre] = useState("");

  // States for sign in / sign up forms
  const [signInUser, setSignInUser] = useState({ username: "", password: "" });
  const [signUpUser, setSignUpUser] = useState({ username: "", password: "" });

  useEffect(() => {
    if (status === "authenticated") {
      fetchMovies();
      fetchPicks();
      fetchCurrentPick();
    }
  }, [status]);

  // ====== AUTH FUNCTIONS ======
  const [signInError, setSignInError] = useState("");
  const [signUpError, setSignUpError] = useState("");

  const handleSignIn = async () => {
    const { username, password } = signInUser;
    if (!username || !password) {
      // CLEAR all
      setSignInUser({ username: "", password: "" });
      setSignInError("username and password required");
      return;
    }

    // NextAuth signIn
    const result = await signIn("credentials", {
      username,
      password,
      redirect: false,
    });
    if (result?.error) {
      // CLEAR password, show inline error
      setSignInUser((prev) => ({ ...prev, password: "" }));
      setSignInError("Sign in failed: please check your credentials.");
    } else {
      // success
      setSignInUser({ username: "", password: "" });
    }
  };

  const handleSignUp = async () => {
    const { username, password } = signUpUser;
    if (!username || !password) {
      // CLEAR all
      setSignUpUser({ username: "", password: "" });
      setSignUpError("username and password required");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (res.ok) {
        setSignUpError("Signup was successful! You can now sign in.");
        setSignUpUser({ username: "", password: "" });
      } else {
        setSignUpUser({ username: "", password: "" });
        setSignUpError("Sign up failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Sign up error. -Server");
    }
  };

  // Fetch the master list
  const fetchMovies = async () => {
    const res = await fetch("/api/movies");
    const data = await res.json();
    setMovies(data);
  };

  // Fetch today's picks
  const fetchPicks = async () => {
    const res = await fetch("/api/picks");
    const data = await res.json();
    setPicks(data);
  };

  // Fetch the current pick
  const fetchCurrentPick = async () => {
    const res = await fetch("/api/currentPick");
    const data = await res.json(); // either null or the CurrentPick
    setCurrentPick(data);
  };

  // ====== MOVIE & PICK HANDLERS ======

  /**
   * Add a new movie. "watched" determines whether it goes to the Master List (false) or the Watched List (true).
   */
  async function handleAddMovie(watched: boolean) {
    setGlobalError("");

    if (!newMovie.title || !newMovie.genre) {
      setGlobalError("Title and genre are required.");
      return;
    }
    if (!session) {
      setGlobalError("Title and genre are required.");
      return;
    }

    const newTitleNormalized = newMovie.title.trim().toLowerCase();

    // Check if there's any movie with the same normalized title
    const existing = movies.find(
      (m) => m.title.trim().toLowerCase() === newTitleNormalized
    );

    // If found a duplicate, check watched status
    if (existing) {
      if (existing.watched && watched) {
        // Already in watched list
        setGlobalError("This title is already in the Watched List.");
        return;
      } else if (!existing.watched && !watched) {
        // Already in master list
        setGlobalError("This title already exists in the Master List.");
        return;
      } else if (existing.watched && !watched) {
        // It's in watched, user tries to add to master
        setGlobalError(
          "This title is in the Watched List; cannot add to Master List."
        );
        return;
      } else if (!existing.watched && watched) {
        // It's in master, user tries to add to watched
        setGlobalError(
          "This title is in the Master List; cannot add to Watched List."
        );
        return;
      }
    }

    // "addedby" from the session user
    const addedby =
      (session.user as any)?.name ||
      (session.user as any)?.email ||
      "Anonymous";

    const payload = {
      title: newMovie.title,
      genre: newMovie.genre,
      addedby,
      watched,
    };
    await fetch("/api/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    setNewMovie({ title: "", genre: "" });
    fetchMovies();
  }

  // Delete from master list
  const handleDeleteMovie = async (id: number) => {
    setGlobalError("");

    // Additional front-end check:
    const isOnPicks = picks.some((p) => p.movieId === id);
    const isCurrent = currentPick?.movieId === id;
    if (isOnPicks || isCurrent) {
      setGlobalError(
        "Cannot delete this movie. Remove it from Today’s Picks / clear the current pick first."
      );
      return;
    }

    await fetch(`/api/movies/${id}`, { method: "DELETE" });
    fetchMovies();
    fetchPicks();
    fetchCurrentPick();
  };

  // Add to today's picks, but only if not already in picks
  const handleAddToPicks = async (movieId: number) => {
    setGlobalError("");

    if (!session) {
      setGlobalError("You must be logged in to add picks!");
      return;
    }

    const alreadyInPicks = picks.some((p) => p.movieId === movieId);
    if (alreadyInPicks) {
      setGlobalError("Movie is already in Today’s Picks!");
      return;
    }

    const userName =
      (session.user as any)?.name ||
      (session.user as any)?.email ||
      "Anonymous";

    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId, addedby: userName }),
    });

    if (!res.ok) {
      const data = await res.json();
      setGlobalError(data.error || "Failed to add pick.");
      return;
    }

    fetchPicks();
  };

  // Remove from today's picks
  const handleRemovePick = async (pickId: number, bypass: number) => {
    setGlobalError("");

    if (bypass === 1) {
    } else {
      if (currentPick?.pickId === pickId) {
        setGlobalError(
          "Cannot remove the current random pick. Please clear it first."
        );
        return;
      }
    }
    await fetch(`/api/picks/${pickId}`, { method: "DELETE" });
    fetchPicks();
    fetchCurrentPick();
  };

  // Random pick from the server
  const handleRandomPick = async () => {
    setGlobalError("");

    const res = await fetch("/api/currentPick", {
      method: "POST",
    });
    if (res.ok) {
      const data = await res.json();
      setCurrentPick(data);
    } else {
      setGlobalError("Error picking a random movie.");
    }
  };

  // Clear the current pick
  const handleClearPick = async () => {
    setGlobalError("");
    const res = await fetch("/api/currentPick", { method: "DELETE" });
    if (res.ok) {
      setCurrentPick(null);
    }
  };

  const handleClearAllPicks = async () => {
    // OPTIONAL: If you want to force the user to clear the current pick first:
    if (currentPick) {
      setGlobalError(
        "Cannot clear all picks while there is a current random pick. Please clear it first."
      );
      return;
    }

    const res = await fetch("/api/picks", { method: "DELETE" });
    if (res.ok) {
      // Refresh the picks list
      fetchPicks();
      // alert("All picks cleared!");
    } else {
      console.error("Error clearing all picks");
    }
  };

  const handleAddCurrentPickToWatched = async () => {
    if (!currentPick) return;
    let p = currentPick.pickId;

    try {
      const res = await fetch(`/api/movies/${currentPick.movieId}`, {
        // const res = await fetch(`/api/movies/${foundMovie.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ watched: true }),
      });
      if (!res.ok) {
        const data = await res.json();
        setGlobalError(data.error || "Failed to mark movie as watched");
        return;
      }
      await handleClearPick();
      await handleRemovePick(p, 1);
      await fetchMovies();
    } catch (error) {
      setGlobalError("Error marking movie as watched.");
      console.error(error);
    }
  };

  // ====== RENDER ======
  if (status === "loading") {
    return <p style={styles.loading}>Loading session...</p>;
  }

  if (status !== "authenticated") {
    // --- SIGN IN / SIGN UP VIEW ---
    return (
      <div style={styles.container}>
        <h1 style={styles.title}>Barn Movie Picker</h1>
        <p style={styles.subtitle}>Please sign in or sign up to continue.</p>

        {/* Sign In Form */}
        <div style={styles.formCard}>
          <h2 style={styles.formHeader}>Sign In</h2>
          <div style={styles.inputGroup}>
            <input
              style={styles.input}
              type="text"
              placeholder="Username"
              value={signInUser.username}
              onChange={(e) =>
                setSignInUser({ ...signInUser, username: e.target.value })
              }
            />
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={signInUser.password}
              onChange={(e) =>
                setSignInUser({ ...signInUser, password: e.target.value })
              }
            />
            <button style={styles.primaryButton} onClick={handleSignIn}>
              Sign In
            </button>
          </div>
          {signInError && (
            <p style={{ color: "red", marginTop: 5 }}>{signInError}</p>
          )}
        </div>

        {/* Sign Up Form */}
        <div style={styles.formCard}>
          <h2 style={styles.formHeader}>Sign Up</h2>
          <div style={styles.inputGroup}>
            <input
              style={styles.input}
              type="text"
              placeholder="Username"
              value={signUpUser.username}
              onChange={(e) =>
                setSignUpUser({ ...signUpUser, username: e.target.value })
              }
            />
            <input
              style={styles.input}
              type="password"
              placeholder="Password"
              value={signUpUser.password}
              onChange={(e) =>
                setSignUpUser({ ...signUpUser, password: e.target.value })
              }
            />
            <button style={styles.primaryButton} onClick={handleSignUp}>
              Sign Up
            </button>
          </div>
          {signUpError && (
            <p style={{ color: "red", marginTop: 5 }}>{signUpError}</p>
          )}
        </div>
      </div>
    );
  }

  // --- AUTHENTICATED VIEW ---
  // Separate into Master vs. Watched
  const masterMovies = movies.filter((m) => m.watched === false);
  const watchedMovies = movies.filter((m) => m.watched === true);

  // Which list do we show?
  const displayedMovies = showWatched ? watchedMovies : masterMovies;
  const listTitle = showWatched ? "Watched List" : "Master List";

  // NEW: Filter the displayedMovies by the searchTitle / searchGenre
  const filteredMovies = displayedMovies.filter((movie) => {
    // Case-insensitive substring check
    const titleMatch = movie.title
      .toLowerCase()
      .includes(searchTitle.toLowerCase());
    const genreMatch = movie.genre
      .toLowerCase()
      .includes(searchGenre.toLowerCase());

    // We only keep the movie if both match
    // ( i.e. it passes the title filter AND the genre filter )
    return titleMatch && genreMatch;
  });

  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Barn Movie Picker</h1>
      <p style={styles.subtitle}>
        You are signed in as: <strong>{session?.user?.name}</strong>
      </p>
      <button style={styles.dangerButton} onClick={() => signOut()}>
        Sign Out
      </button>

      {globalError && (
        <p style={{ color: "red", marginTop: 5 }}>{globalError}</p>
      )}

      {/* Add Movie Form */}
      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Add New Movie</h2>
        <div style={styles.inputGroup}>
          <input
            style={styles.input}
            type="text"
            placeholder="Title"
            value={newMovie.title}
            onChange={(e) =>
              setNewMovie({ ...newMovie, title: e.target.value })
            }
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Genre"
            value={newMovie.genre}
            onChange={(e) =>
              setNewMovie({ ...newMovie, genre: e.target.value })
            }
          />
        </div>
        <div style={{ display: "flex", gap: "1rem" }}>
          {/* Add to Master List => watched = false */}
          <button
            style={styles.primaryButton}
            onClick={() => handleAddMovie(false)}
          >
            Add to Master List
          </button>
          {/* Add to Watched List => watched = true */}
          <button
            style={styles.primaryButton}
            onClick={() => handleAddMovie(true)}
          >
            Add to Watched List
          </button>
        </div>
      </div>

      {/* SINGLE TOGGLABLE LIST: MASTER OR WATCHED */}
      <div style={styles.section}>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: "1rem",
          }}
        >
          <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }}>
            {listTitle}
          </h2>
          <button
            style={styles.secondaryButton}
            onClick={() => setShowWatched((prev) => !prev)}
          >
            Switch to {showWatched ? "Master List" : "Watched List"}
          </button>
        </div>

        {/* NEW: Two search bars for Title & Genre */}
        <div style={styles.inputGroup}>
          <input
            style={styles.input}
            type="text"
            placeholder="Search by title..."
            value={searchTitle}
            onChange={(e) => setSearchTitle(e.target.value)}
          />
          <input
            style={styles.input}
            type="text"
            placeholder="Search by genre..."
            value={searchGenre}
            onChange={(e) => setSearchGenre(e.target.value)}
          />
        </div>

        <ul style={styles.list}>
          {filteredMovies.map((movie) => {
            const isOnTodaysPicks = picks.some((p) => p.movieId === movie.id);
            const isCurrentPick = currentPick?.movieId === movie.id;

            const canDelete = !isOnTodaysPicks && !isCurrentPick;

            return (
              <li key={movie.id} style={styles.listItem}>
                <div>
                  <strong>{movie.title}</strong> ({movie.genre}) <br />
                  <em style={{ fontSize: "0.9rem" }}>
                    Added by {movie.addedby}
                  </em>
                </div>
                <div style={styles.itemActions}>
                  {/* If this is the Master List, show "Add to Picks" 
                      If this is the Watched List, skip picks. */}
                  {!showWatched &&
                    (isOnTodaysPicks ? (
                      <button style={styles.primarySmallButton} disabled>
                        In Picks
                      </button>
                    ) : (
                      <button
                        style={styles.primarySmallButton}
                        onClick={() => handleAddToPicks(movie.id)}
                      >
                        Add to Picks
                      </button>
                    ))}

                  {/* Delete Button (common) */}
                  {canDelete ? (
                    <button
                      style={styles.dangerSmallButton}
                      onClick={() => handleDeleteMovie(movie.id)}
                    >
                      Delete
                    </button>
                  ) : (
                    <button style={styles.dangerSmallButton} disabled>
                      Remove from picks first
                    </button>
                  )}
                </div>
              </li>
            );
          })}
        </ul>
      </div>

      {/* Today's Picks */}
      <div style={{ ...styles.section, ...styles.sectionAlt }}>
        <h2 style={styles.sectionTitle}>Today's Picks</h2>
        <ul style={styles.list}>
          {picks.map((pick) => {
            const isCurrentPick = currentPick?.pickId === pick.pickId;
            return (
              <li key={pick.pickId} style={styles.listItem}>
                <div>
                  <strong>{pick.title}</strong> ({pick.genre}) <br />
                  <em style={{ fontSize: "0.9rem" }}>
                    Added by {pick.addedby}
                  </em>
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

      {/* Current Random Pick */}
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
            <button style={styles.dangerButton} onClick={handleClearPick}>
              Clear Current Pick
            </button>
            <button
              style={styles.primaryButton}
              onClick={handleAddCurrentPickToWatched}
            >
              Add to Watched
            </button>
          </div>
        ) : (
          <p style={{ marginBottom: "1rem" }}>No movie is currently chosen.</p>
        )}
        <button style={styles.primaryButton} onClick={handleRandomPick}>
          Pick a Random Movie
        </button>
      </div>
    </div>
  );
}

// ======== COLORS =========
const dangerColor = "#71130F";
const primaryButtonColor = "#226284";
const secondaryButtonColor = "#444444";

// ====== DARK THEME STYLES ======
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    margin: "0 auto",
    maxWidth: "500px",
    padding: "1rem",
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    backgroundColor: "#121212", // Dark background
    color: "#ffffff", // White text
    minHeight: "100vh",
  },
  title: {
    fontSize: "1.8rem",
    marginBottom: "0.5rem",
    textAlign: "center",
  },
  subtitle: {
    textAlign: "center",
    marginBottom: "1rem",
    color: "#ccc",
  },
  loading: {
    fontFamily: "'Helvetica Neue', Arial, sans-serif",
    padding: "1rem",
    textAlign: "center",
    backgroundColor: "#121212",
    color: "#fff",
    minHeight: "100vh",
  },
  // Sign In / Sign Up
  formCard: {
    marginBottom: "1rem",
    border: "1px solid #333",
    borderRadius: "5px",
    padding: "1rem",
    background: "#1e1e1e",
  },
  formHeader: {
    margin: "0 0 0.5rem 0",
    fontSize: "1.2rem",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "0.5rem",
    marginBottom: "0.5rem",
  },
  input: {
    padding: "0.5rem",
    borderRadius: "4px",
    border: "1px solid #444",
    fontSize: "1rem",
    backgroundColor: "#2c2c2c",
    color: "#fff",
  },
  // Buttons
  primaryButton: {
    background: primaryButtonColor,
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "0.6rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  dangerButton: {
    background: dangerColor,
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "0.6rem",
    cursor: "pointer",
    marginTop: "0.5rem",
  },
  secondaryButton: {
    background: secondaryButtonColor,
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "0.4rem 0.8rem",
    cursor: "pointer",
  },
  // Smaller buttons
  primarySmallButton: {
    background: primaryButtonColor,
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "0.4rem 0.8rem",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  dangerSmallButton: {
    background: dangerColor,
    color: "#fff",
    border: "none",
    borderRadius: "4px",
    padding: "0.4rem 0.8rem",
    fontSize: "0.85rem",
    cursor: "pointer",
  },
  // Sections
  section: {
    marginTop: "2rem",
    padding: "1rem",
    borderRadius: "8px",
    backgroundColor: "#1e1e1e",
    border: "1px solid #333",
  },
  sectionAlt: {
    backgroundColor: "#242424",
  },
  sectionAlt2: {
    backgroundColor: "#2a2a2a",
  },
  sectionTitle: {
    marginBottom: "1rem",
    fontSize: "1.3rem",
  },
  // Lists
  list: {
    listStyle: "none",
    padding: 0,
    margin: 0,
    marginBottom: "1rem",
  },
  listItem: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "0.5rem",
    marginBottom: "0.5rem",
    border: "1px solid #444",
    borderRadius: "4px",
    background: "#2c2c2c",
  },
  itemActions: {
    display: "flex",
    gap: "0.3rem",
  },
  // Current Pick
  currentPickBox: {
    border: "1px solid #444",
    borderRadius: "4px",
    background: "#2c2c2c",
    padding: "1rem",
    marginBottom: "1rem",
  },
};

