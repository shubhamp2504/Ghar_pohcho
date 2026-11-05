import type { RouteComment, CreateCommentInput } from '../../types/comments';

const STORAGE_KEY = 'gharpahucho_route_comments_v1';
const UPVOTED_KEY = 'gharpahucho_upvoted_comment_ids';

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
   * Fetches only REAL user comments posted for TODAY on a given corridor.
   * Previous days' data is excluded to ensure drivers only see live relevant road status.
   */
  async getCommentsForCorridor(corridorKey: string): Promise<RouteComment[]> {
    const all = this.loadAllComments();
    const todayStr = new Date().toDateString();

    return all
      .filter((c) => {
        if (c.corridorKey !== corridorKey) return false;
        // Verify comment is from today (or last 18 hours max)
        const commentDate = new Date(c.createdAt);
        const isToday = commentDate.toDateString() === todayStr;
        const isRecent = Date.now() - commentDate.getTime() < 18 * 3600 * 1000;
        return isToday || isRecent;
      })
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  /**
   * Posts a new user comment to the corridor board with authenticated current timestamp
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
    if (typeof window === 'undefined') return [];
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      return JSON.parse(raw) as RouteComment[];
    } catch {
      return [];
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
