// app/components/AddMovieForm.tsx
"use client";
import React from "react";
import { styles } from "@/app/styles/pageStyles";

type Props = {
  onAddMovie: (watched: boolean) => void;
  newMovie: { title: string; genre: string };
  setNewMovie: React.Dispatch<React.SetStateAction<{ title: string; genre: string }>>;
};

export default function AddMovieForm({ onAddMovie, newMovie, setNewMovie }: Props) {
  return (
    <div style={styles.section}>
      <h2 style={styles.sectionTitle} >Add New Movie</h2>
      <input
        style={styles.input}
        placeholder="Title"
        value={newMovie.title}
        onChange={(e) => setNewMovie({ ...newMovie, title: e.target.value })}
      />
      <input
        style={styles.input}
        placeholder="Genre"
        value={newMovie.genre}
        onChange={(e) => setNewMovie({ ...newMovie, genre: e.target.value })}
      />
      <div style={{ display: "flex", gap: "1rem" }}>
        <button onClick={() => onAddMovie(false)}style={styles.primaryButton}>Add to Master</button>
        <button onClick={() => onAddMovie(true)}style={styles.primaryButton}>Add to Watched</button>
      </div>
    </div>
  );
}
