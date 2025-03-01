"use client";
import React, { useEffect, useState } from "react";
import { signIn, signOut, useSession } from "next-auth/react";
import { Movie, TodayPick, CurrentPick } from "@/types";

import SignInSignUpForms from "./components/SignInSignUpForms";
import AddMovieForm from "./components/AddMovieForm";
import MovieLists from "./components/MovieLists";
import CurrentPickSection from "./components/CurrentPickSection";
import TodaysPicksSection from "./components/TodaysPicksSection";

import { styles } from "@/app/styles/pageStyles";

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

  const [signInUser, setSignInUser] = useState({ username: "", password: "" });
  const [signUpUser, setSignUpUser] = useState({
    username: "",
    password: "",
    group: "",
  });
  const [signInError, setSignInError] = useState("");
  const [signUpError, setSignUpError] = useState("");

  const userName = (session?.user as any)?.name;
  const userGroup = (session?.user as any)?.groupId;
  const userId = (session?.user as any)?.id;
  const userHasPick = picks.some((p) => p.addedby === userName);

  const [groupName, setGroupName] = useState("");

  useEffect(() => {
    if (status === "authenticated") {
      fetchMovies();
      fetchPicks();
      fetchCurrentPick();
      fetchGroupName();
    }
  }, [status]);

  useEffect(() => {
    console.log(session);
  }, [session]);
  useEffect(() => {
    console.log(groupName);
  }, [groupName]);

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
    const { username, password, group } = signUpUser;
    if (!username || !password || !group) {
      // CLEAR all
      setSignUpUser({ username: "", password: "", group: "" });
      setSignUpError("username and password required");
      return;
    }

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, group }),
      });
      const data = await res.json();
      if (res.ok) {
        setSignUpError("Signup was successful! You can now sign in.");
        setSignUpUser({ username: "", password: "", group: "" });
      } else {
        setSignUpUser({ username: "", password: "", group: "" });
        setSignUpError("Sign up failed: " + data.error);
      }
    } catch (err) {
      console.error(err);
      alert("Sign up error. -Server");
    }
  };

  async function onCreateGroup(groupName: string) {
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName }),
      });
      if (!res.ok) {
        const data = await res.json();

        setSignUpError("Create group failed: " + (data.error || "Unknown"));
        return;
      }
      const data = await res.json();
      setSignUpError(`${data.name} created`);
    } catch (err) {
      console.error(err);
      setSignUpError("Create group error. -Server");
    }
  }

  // Fetch the gropu name
  const fetchGroupName = async () => {
    const res = await fetch("/api/groups");
    const data = await res.json();
    if (res.status === 401) {
      signOut();
      setGroupName("")
      return;
    }
    setGroupName(data[0].name);
  };

  // Fetch the master list
  const fetchMovies = async () => {
    const res = await fetch("/api/movies");
    const data = await res.json();
    if (res.status === 401) {
      signOut();
      setMovies([])
      return;
    }
    setMovies(data);
  };

  // Fetch today's picks
  const fetchPicks = async () => {
    const res = await fetch("/api/picks");
    const data = await res.json();
    if (res.status === 401) {
      signOut();
      setPicks([])
      return;
    }
    setPicks(data);
  };

  // Fetch the current pick
  const fetchCurrentPick = async () => {
    // let groupId = (session as any)?.user.groupId
    // const res = await fetch(`/api/currentPick?groupId=${groupId}`);

    const res = await fetch("/api/currentPick");
    const data = await res.json(); // either null or the CurrentPick
    if (res.status === 401) {
      signOut();
      setCurrentPick(null)
      return;
    }
    setCurrentPick(data);
  };

  // ====== MOVIE & PICK HANDLERS ======

  /**
   * Add a new movie. "watched" determines whether it goes to the Master List (false) or the Watched List (true).
   */
  async function handleAddMovieToMasterOrWatched(watched: boolean) {
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
    const addedby = (session.user as any)?.id || -1;

    let groupId = (session as any)?.user.groupId;

    const payload = {
      title: newMovie.title,
      genre: newMovie.genre,
      addedby,
      watched,
      groupId,
    };
    let res = await fetch("/api/movies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const data = await res.json();
      setGlobalError(data.error || "Failed to add movie.");
      return;
    }
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

    const userName = (session.user as any)?.id || -1;
    let groupId = (session as any)?.user.groupId;

    const res = await fetch("/api/picks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ movieId, addedby: userName, groupid: groupId }),
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

  // 2) define a handler to call the upvote API
  async function handleUpvotePick(pickId: number) {
    try {
      // We'll pass the userName so server knows who is upvoting
      const res = await fetch(`/api/picks/${pickId}/upvote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: userId,
          userName: userName,
          userGroup: userGroup,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        setGlobalError(data.error || "Upvote failed.");
        return;
      }
      // If success, re-fetch picks so we see updated weights
      fetchPicks();
    } catch (err) {
      console.error("Upvote error:", err);
      setGlobalError("Error upvoting pick.");
    }
  }
  async function handleRemoveUpvote(pickId: number) {
    try {
      const res = await fetch(`/api/picks/${pickId}/upvote`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: userId }),
      });
      if (!res.ok) {
        const data = await res.json();
        setGlobalError(data.error || "Failed to remove upvote.");
        return;
      }
      // re-fetch picks
      fetchPicks();
    } catch (err) {
      console.error("Remove upvote error:", err);
      setGlobalError("Error removing upvote");
    }
  }

  // ====== RENDER ============================================================================
  if (status === "loading") {
    return <p style={styles.loading}>Loading session...</p>;
  }

  if (status !== "authenticated") {
    return (
      <SignInSignUpForms
        onSignIn={handleSignIn}
        onSignUp={handleSignUp}
        signInUser={signInUser}
        setSignInUser={setSignInUser}
        signUpUser={signUpUser}
        setSignUpUser={setSignUpUser}
        signInError={signInError}
        signUpError={signUpError}
        onCreateGroup={onCreateGroup}
      />
    );
  }

  // user is authenticated
  return (
    <div style={styles.container}>
      <h1 style={styles.title}>Barn Movie Picker</h1>
      <p style={styles.subtitle}>
        You are signed in as <strong>{session?.user?.name} </strong>with group{" "}
        <strong>{groupName}</strong>
      </p>
      <button onClick={() => signOut()} style={styles.dangerButton}>
        Sign Out
      </button>

      {globalError && <p style={{ color: "red" }}>{globalError}</p>}

      <AddMovieForm
        onAddMovie={handleAddMovieToMasterOrWatched}
        newMovie={newMovie}
        setNewMovie={setNewMovie}
      />

      <MovieLists
        movies={movies}
        picks={picks}
        currentPick={currentPick}
        showWatched={showWatched}
        setShowWatched={setShowWatched}
        searchTitle={searchTitle}
        setSearchTitle={setSearchTitle}
        searchGenre={searchGenre}
        setSearchGenre={setSearchGenre}
        onAddToPicks={handleAddToPicks}
        onDeleteMovie={handleDeleteMovie}
        globalError={globalError}
        setGlobalError={setGlobalError}
      />

      <TodaysPicksSection
        picks={picks}
        currentPick={currentPick}
        handleRemovePick={handleRemovePick}
        handleClearAllPicks={handleClearAllPicks}
        userHasPick={userHasPick}
        onUpvotePick={handleUpvotePick}
        userName={userName}
        handleRemoveUpvote={handleRemoveUpvote}
      />

      <CurrentPickSection
        currentPick={currentPick}
        picks={picks}
        onClearPick={handleClearPick}
        onRandomPick={handleRandomPick}
        onSetRandomPick={setCurrentPick}
        onAddCurrentPickToWatched={handleAddCurrentPickToWatched}
      />
    </div>
  );
}
