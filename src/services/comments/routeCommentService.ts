import type { RouteComment, CreateCommentInput } from '../../types/comments';

const STORAGE_KEY = 'gharpahucho_route_comments_v1';
const UPVOTED_KEY = 'gharpahucho_upvoted_comment_ids';

const SEEDED_COMMENTS: RouteComment[] = [
  // --- Mumbai to Pune Corridor ---
  {
    id: 'comm_mp_1',
    corridorKey: 'mumbai_pune',
    authorName: 'Highway Regular (Honda City)',
    locationTag: 'Near Khandala Ghat (KM 74)',
    tag: 'CLEAR_ROAD',
    text: 'Ghat section is completely clear now. Earlier drizzle has stopped, road is dry and traffic moving at 70-80 km/h.',
    createdAt: new Date(Date.now() - 14 * 60 * 1000).toISOString(), // 14 mins ago
    upvotes: 8,
  },
  {
    id: 'comm_mp_2',
    corridorKey: 'mumbai_pune',
    authorName: 'Priya K. (Commuter)',
    locationTag: 'Khalapur Toll Plaza (KM 54)',
    tag: 'FASTAG_DELAY',
    text: 'Fastag lane 2 scanner was restarting. Recommend taking extreme left lanes (4 or 5) for quick 30-second clearance.',
    createdAt: new Date(Date.now() - 32 * 60 * 1000).toISOString(), // 32 mins ago
    upvotes: 14,
  },
  {
    id: 'comm_mp_3',
    corridorKey: 'mumbai_pune',
    authorName: 'Rohan D. (SUV)',
    locationTag: 'Urse Food Mall (KM 96)',
    tag: 'GENERAL_TIP',
    text: 'Urse food court has ample clean parking right now. Tata Power DC charger has 1 gun available if you need a quick 20 min top-up.',
    createdAt: new Date(Date.now() - 55 * 60 * 1000).toISOString(), // 55 mins ago
    upvotes: 6,
  },

  // --- Delhi to Jaipur Corridor ---
  {
    id: 'comm_dj_1',
    corridorKey: 'delhi_jaipur',
    authorName: 'Vikas Sharma',
    locationTag: 'Dharuhera Flyover (KM 68)',
    tag: 'CONSTRUCTION',
    text: 'Flyover maintenance on left lane after Dharuhera. Stay in center lane to avoid sudden braking.',
    createdAt: new Date(Date.now() - 20 * 60 * 1000).toISOString(),
    upvotes: 11,
  },
  {
    id: 'comm_dj_2',
    corridorKey: 'delhi_jaipur',
    authorName: 'Delhi Commuter',
    locationTag: 'Kherki Daula Toll',
    tag: 'CLEAR_ROAD',
    text: 'Toll plaza moving very smoothly today. Under 2 minutes clearance.',
    createdAt: new Date(Date.now() - 48 * 60 * 1000).toISOString(),
    upvotes: 5,
  },

  // --- Bengaluru to Mysuru Corridor ---
  {
    id: 'comm_bm_1',
    corridorKey: 'bengaluru_mysuru',
    authorName: 'Karthik N.',
    locationTag: 'Ramanagara Bypass',
    tag: 'CLEAR_ROAD',
    text: 'Expressway surface is spotless. Speed cameras active near Bidadi, maintain 100 km/h limit.',
    createdAt: new Date(Date.now() - 18 * 60 * 1000).toISOString(),
    upvotes: 19,
  },
];

export class RouteCommentService {
  /**
   * Generates a stable corridor identifier based on origin and destination names.
   * e.g., "Chembur, Mumbai" + "Koregaon Park, Pune" -> "mumbai_pune"
   */
  generateCorridorKey(originName: string, destinationName: string): string {
    const cleanOrigin = originName.toLowerCase();
    const cleanDest = destinationName.toLowerCase();

    // Check known corridors
    if (
      (cleanOrigin.includes('mumbai') || cleanOrigin.includes('thane') || cleanOrigin.includes('navi')) &&
      (cleanDest.includes('pune') || cleanDest.includes('pcmc') || cleanDest.includes('kothrud'))
    ) {
      return 'mumbai_pune';
    }

    if (
      (cleanOrigin.includes('pune') || cleanOrigin.includes('pcmc')) &&
      (cleanDest.includes('mumbai') || cleanDest.includes('thane') || cleanDest.includes('navi'))
    ) {
      return 'mumbai_pune';
    }

    if (
      (cleanOrigin.includes('delhi') || cleanOrigin.includes('gurgaon') || cleanOrigin.includes('gurugram')) &&
      cleanDest.includes('jaipur')
    ) {
      return 'delhi_jaipur';
    }

    if (cleanOrigin.includes('jaipur') && (cleanDest.includes('delhi') || cleanDest.includes('gurgaon'))) {
      return 'delhi_jaipur';
    }

    if (cleanOrigin.includes('bengaluru') || cleanOrigin.includes('bangalore')) {
      if (cleanDest.includes('mysuru') || cleanDest.includes('mysore')) {
        return 'bengaluru_mysuru';
      }
    }

    // Generic key based on the first words of both places
    const firstWordOrigin = cleanOrigin.split(/[\s,]+/)[0].replace(/[^a-z0-9]/g, '') || 'start';
    const firstWordDest = cleanDest.split(/[\s,]+/)[0].replace(/[^a-z0-9]/g, '') || 'dest';
    return `${firstWordOrigin}_${firstWordDest}`;
  }

  /**
   * Fetches all comments for a given corridor, sorted newest first
   */
  async getCommentsForCorridor(corridorKey: string): Promise<RouteComment[]> {
    const all = this.loadAllComments();
    return all
      .filter((c) => c.corridorKey === corridorKey)
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Posts a new user comment to the corridor board
   */
  async postComment(input: CreateCommentInput): Promise<RouteComment> {
    const newComment: RouteComment = {
      id: 'comm_' + Math.random().toString(36).substring(2, 9),
      corridorKey: input.corridorKey,
      authorName: input.authorName?.trim() || 'Highway Traveller',
      locationTag: input.locationTag?.trim() || undefined,
      tag: input.tag,
      text: input.text.trim(),
      createdAt: new Date().toISOString(),
      upvotes: 1, // Author's initial verification
    };

    const all = this.loadAllComments();
    all.unshift(newComment);
    this.saveAllComments(all);

    return newComment;
  }

  /**
   * Upvotes a comment to confirm its reliability
   */
  async upvoteComment(commentId: string): Promise<{ upvotes: number; alreadyVoted: boolean }> {
    const upvotedIds = this.getUpvotedIds();
    if (upvotedIds.has(commentId)) {
      const all = this.loadAllComments();
      const target = all.find((c) => c.id === commentId);
      return { upvotes: target?.upvotes || 0, alreadyVoted: true };
    }

    const all = this.loadAllComments();
    const target = all.find((c) => c.id === commentId);
    if (!target) {
      return { upvotes: 0, alreadyVoted: false };
    }

    target.upvotes += 1;
    this.saveAllComments(all);

    upvotedIds.add(commentId);
    this.saveUpvotedIds(upvotedIds);

    return { upvotes: target.upvotes, alreadyVoted: false };
  }

  hasUpvoted(commentId: string): boolean {
    return this.getUpvotedIds().has(commentId);
  }

  private loadAllComments(): RouteComment[] {
    if (typeof window === 'undefined') return [...SEEDED_COMMENTS];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        this.saveAllComments(SEEDED_COMMENTS);
        return [...SEEDED_COMMENTS];
      }
      return JSON.parse(raw) as RouteComment[];
    } catch {
      return [...SEEDED_COMMENTS];
    }
  }

  private saveAllComments(comments: RouteComment[]): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(comments));
    } catch {
      // storage full or disabled
    }
  }

  private getUpvotedIds(): Set<string> {
    if (typeof window === 'undefined') return new Set();
    try {
      const raw = localStorage.getItem(UPVOTED_KEY);
      return new Set(raw ? JSON.parse(raw) : []);
    } catch {
      return new Set();
    }
  }

  private saveUpvotedIds(ids: Set<string>): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.setItem(UPVOTED_KEY, JSON.stringify(Array.from(ids)));
    } catch {
      // storage full
    }
  }
}

export const routeCommentService = new RouteCommentService();
