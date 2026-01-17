export interface DocumentState {
  id: string;
  title: string;
  content: string;
  lastSaved: number;
}

export enum Theme {
  LIGHT = 'light',
  DARK = 'dark'
}
