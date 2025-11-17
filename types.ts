export interface Tile {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean; // Not used in this version, but good for future extension
}

export enum GameStatus {
  Ready = 'ready',
  Playing = 'playing',
  Lost = 'lost',
  CashedOut = 'cashedOut',
}