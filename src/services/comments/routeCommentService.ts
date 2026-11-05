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

    const isMumb = (s: string) => s.includes('mumbai') || s.includes('thane') || s.includes('navi') || s.includes('chembur') || s.includes('bandra') || s.includes('dadar') || s.includes('andheri') || s.includes('sewri');
    const isPune = (s: string) => s.includes('pune') || s.includes('pcmc') || s.includes('kothrud') || s.includes('shivajinagar') || s.includes('hadapsar') || s.includes('hinjawadi') || s.includes('swargate');
    const isNagpur = (s: string) => s.includes('nagpur') || s.includes('butibori');
    const isNashik = (s: string) => s.includes('nashik') || s.includes('panchavati') || s.includes('dwarka') || s.includes('trimbak');
    const isKolhapur = (s: string) => s.includes('kolhapur') || s.includes('shiroli') || s.includes('ichalkaranji');
    const isMahabaleshwar = (s: string) => s.includes('mahabaleshwar') || s.includes('panchgani');
    const isAlibaug = (s: string) => s.includes('alibaug') || s.includes('varsoli') || s.includes('nagaon');
    const isGoa = (s: string) => s.includes('goa') || s.includes('sawantwadi') || s.includes('tarkarli') || s.includes('malvan') || s.includes('chiplun');
    const isShirdi = (s: string) => s.includes('shirdi') || s.includes('saibaba');
    const isPandharpur = (s: string) => s.includes('pandharpur');
    const isSolapur = (s: string) => s.includes('solapur') || s.includes('siddheshwar') || s.includes('tuljapur');

    // 1. Mumbai <-> Pune
    if ((isMumb(cleanOrigin) && isPune(cleanDest)) || (isPune(cleanOrigin) && isMumb(cleanDest))) {
      return 'mumbai_pune';
    }

    // 2. Mumbai <-> Nagpur (Samruddhi Mahamarg)
    if ((isMumb(cleanOrigin) && isNagpur(cleanDest)) || (isNagpur(cleanOrigin) && isMumb(cleanDest))) {
      return 'mumbai_nagpur';
    }

    // 3. Mumbai <-> Nashik (NH 160)
    if ((isMumb(cleanOrigin) && isNashik(cleanDest)) || (isNashik(cleanOrigin) && isMumb(cleanDest))) {
      return 'mumbai_nashik';
    }

    // 4. Pune <-> Mahabaleshwar
    if ((isPune(cleanOrigin) && isMahabaleshwar(cleanDest)) || (isMahabaleshwar(cleanOrigin) && isPune(cleanDest))) {
      return 'pune_mahabaleshwar';
    }

    // 5. Pune <-> Kolhapur
    if ((isPune(cleanOrigin) && isKolhapur(cleanDest)) || (isKolhapur(cleanOrigin) && isPune(cleanDest))) {
      return 'pune_kolhapur';
    }

    // 6. Mumbai <-> Goa
    if ((isMumb(cleanOrigin) && isGoa(cleanDest)) || (isGoa(cleanOrigin) && isMumb(cleanDest))) {
      return 'mumbai_goa';
    }

    // 7. Pune <-> Nashik
    if ((isPune(cleanOrigin) && isNashik(cleanDest)) || (isNashik(cleanOrigin) && isPune(cleanDest))) {
      return 'pune_nashik';
    }

    // 8. Mumbai <-> Alibaug
    if ((isMumb(cleanOrigin) && isAlibaug(cleanDest)) || (isAlibaug(cleanOrigin) && isMumb(cleanDest))) {
      return 'mumbai_alibaug';
    }

    // 9. Mumbai/Pune <-> Shirdi
    if (isShirdi(cleanOrigin) || isShirdi(cleanDest)) {
      if (isMumb(cleanOrigin) || isMumb(cleanDest)) return 'mumbai_shirdi';
      return 'pune_shirdi';
    }

    // 10. Pune <-> Pandharpur
    if ((isPune(cleanOrigin) && isPandharpur(cleanDest)) || (isPandharpur(cleanOrigin) && isPune(cleanDest))) {
      return 'pune_pandharpur';
    }

    // 11. Pune <-> Solapur
    if ((isPune(cleanOrigin) && isSolapur(cleanDest)) || (isSolapur(cleanOrigin) && isPune(cleanDest))) {
      return 'pune_solapur';
    }

    // 12. Delhi <-> Jaipur
    if (
      (cleanOrigin.includes('delhi') || cleanOrigin.includes('gurgaon') || cleanOrigin.includes('gurugram')) &&
      cleanDest.includes('jaipur')
    ) {
      return 'delhi_jaipur';
    }
    if (cleanOrigin.includes('jaipur') && (cleanDest.includes('delhi') || cleanDest.includes('gurgaon'))) {
      return 'delhi_jaipur';
    }

    // 13. Bengaluru <-> Mysuru
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
