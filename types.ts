// /types.ts

export type Movie = {
    id: number;
    title: string;
    genre: string;
    addedby: string;
    watched?: boolean;
  };
  
  export type TodayPick = {
    pickId: number;
    movieId: number;
    title: string;
    genre: string;
    addedby: string;
    upvoters: string[];
    pickedBy: any
  };
  
  export type CurrentPick = {
    currentPickId: number;
    pickId: number;
    movieId: number;
    title: string;
    genre: string;
    addedby: string;
    chosenAt: string;
  };
  