// app/components/MovieLists.tsx
"use client";
import React from "react";
import { Movie, TodayPick, CurrentPick } from "@/types";
import { styles } from "@/app/styles/pageStyles";

type Props = {
  movies: Movie[];
  picks: TodayPick[];
  currentPick: CurrentPick | null;
  showWatched: boolean;
  setShowWatched: React.Dispatch<React.SetStateAction<boolean>>;
  searchTitle: string;
  setSearchTitle: React.Dispatch<React.SetStateAction<string>>;
  searchGenre: string;
  setSearchGenre: React.Dispatch<React.SetStateAction<string>>;

  onAddToPicks: (movieId: number) => void;
  onDeleteMovie: (id: number) => void;

  globalError: string;
  setGlobalError: React.Dispatch<React.SetStateAction<string>>;
};

export default function MovieLists(props: Props) {
  const {
    movies,
    picks,
    currentPick,
    showWatched,
    setShowWatched,
    searchTitle,
    setSearchTitle,
    searchGenre,
    setSearchGenre,
    onAddToPicks,
    onDeleteMovie,
    globalError,
    setGlobalError,
  } = props;

  // filter master vs watched
  const masterMovies = movies.filter((m) => !m.watched);
  const watchedMovies = movies.filter((m) => m.watched);
  const listTitle = showWatched ? "Watched List" : "Master List";
  const displayedMovies = showWatched ? watchedMovies : masterMovies;

  // filter by search
  const filteredMovies = displayedMovies.filter((m) => {
    const titleMatch = m.title
      .toLowerCase()
      .includes(searchTitle.toLowerCase());
    const genreMatch = m.genre
      .toLowerCase()
      .includes(searchGenre.toLowerCase());
    return titleMatch && genreMatch;
  });

  return (
    <div style={styles.section}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "1rem",
        }}
      >
        <h2 style={{ ...styles.sectionTitle, marginBottom: 0 }}>{listTitle}</h2>
        <button
          onClick={() => setShowWatched((prev) => !prev)}
          style={styles.secondaryButton}
        >
          Switch to {showWatched ? "Master List" : "Watched List"}
        </button>
      </div>

      {/* Search bars */}
      <div style={styles.inputGroup}>
        <input
          placeholder="Search by title..."
          value={searchTitle}
          onChange={(e) => setSearchTitle(e.target.value)}
          style={styles.input}
        />
        <input
          placeholder="Search by genre..."
          value={searchGenre}
          onChange={(e) => setSearchGenre(e.target.value)}
          style={styles.input}
        />
      </div>

      {/* Render filtered movies */}
      <ul style={styles.list}>
        {filteredMovies.map((movie) => {
          const isOnTodaysPicks = picks.some((p) => p.movieId === movie.id);
          const isCurrent = currentPick?.movieId === movie.id;
          const canDelete = !isOnTodaysPicks && !isCurrent;

          return (
            <li key={movie.id} style={styles.listItem}>
              <div>
                <strong>{movie.title}</strong> ({movie.genre}) <br />
                <em style={{ fontSize: "0.9rem" }}>Added by {movie.addedby}</em>
              </div>
              <div style={styles.itemActions}>
                {!showWatched &&
                  (isOnTodaysPicks ? (
                    <button disabled style={styles.primarySmallButton}>In Picks</button>
                  ) : (
                    <button style={styles.primarySmallButton} onClick={() => onAddToPicks(movie.id)}>
                      Add to Picks
                    </button>
                  ))}
                {canDelete ? (
                  <button style={styles.dangerSmallButton} onClick={() => onDeleteMovie(movie.id)}>
                    Delete
                  </button>
                ) : (
                  <button style={styles.dangerSmallButton} disabled>Remove from picks first</button>
                )}
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
