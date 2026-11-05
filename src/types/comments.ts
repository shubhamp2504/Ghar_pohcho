export type CommentTag =
  | 'CLEAR_ROAD'
  | 'HEAVY_RAIN_FOG'
  | 'SUDDEN_SLOWDOWN'
  | 'FASTAG_DELAY'
  | 'CONSTRUCTION'
  | 'ACCIDENT_CLEARED'
  | 'GENERAL_TIP';

export interface RouteComment {
  id: string;
  corridorKey: string;
  authorName: string;
  locationTag?: string;
  tag: CommentTag;
  text: string;
  createdAt: string;
  upvotes: number;
}

export interface CreateCommentInput {
  corridorKey: string;
  authorName?: string;
  locationTag?: string;
  tag: CommentTag;
  text: string;
}

