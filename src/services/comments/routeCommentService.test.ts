import { describe, it, expect, beforeEach } from 'vitest';
import { routeCommentService } from './routeCommentService';

describe('RouteCommentService', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('correctly maps corridor keys for Mumbai-Pune and Delhi-Jaipur', () => {
    expect(routeCommentService.generateCorridorKey('Chembur, Mumbai', 'Koregaon Park, Pune')).toBe('mumbai_pune');
    expect(routeCommentService.generateCorridorKey('Thane West', 'Shivajinagar, Pune')).toBe('mumbai_pune');
    expect(routeCommentService.generateCorridorKey('Connaught Place, New Delhi', 'Jaipur, Rajasthan')).toBe('delhi_jaipur');
    expect(routeCommentService.generateCorridorKey('Bengaluru City', 'Mysuru')).toBe('bengaluru_mysuru');
  });

  it('filters comments strictly by corridor so routes are not combined', async () => {
    const mumbaiComments = await routeCommentService.getCommentsForCorridor('mumbai_pune');
    const delhiComments = await routeCommentService.getCommentsForCorridor('delhi_jaipur');

    expect(mumbaiComments.length).toBeGreaterThan(0);
    expect(delhiComments.length).toBeGreaterThan(0);

    // Verify no Mumbai comments leak into Delhi
    expect(mumbaiComments.every((c) => c.corridorKey === 'mumbai_pune')).toBe(true);
    expect(delhiComments.every((c) => c.corridorKey === 'delhi_jaipur')).toBe(true);
  });

  it('allows posting a new comment and retrieving it at the top', async () => {
    const newComment = await routeCommentService.postComment({
      corridorKey: 'mumbai_pune',
      authorName: 'Test Driver',
      locationTag: 'Near Bhor Ghat',
      tag: 'HEAVY_RAIN_FOG',
      text: 'Thick fog rolling in, keep headlights on low beam.',
    });

    expect(newComment.id).toBeDefined();
    expect(newComment.authorName).toBe('Test Driver');

    const updated = await routeCommentService.getCommentsForCorridor('mumbai_pune');
    expect(updated[0].id).toBe(newComment.id);
    expect(updated[0].text).toContain('Thick fog rolling in');
  });

  it('handles upvoting comments cleanly without double votes', async () => {
    const comments = await routeCommentService.getCommentsForCorridor('mumbai_pune');
    const firstComment = comments[0];
    const initialUpvotes = firstComment.upvotes;

    const res1 = await routeCommentService.upvoteComment(firstComment.id);
    expect(res1.upvotes).toBe(initialUpvotes + 1);
    expect(res1.alreadyVoted).toBe(false);

    // Try upvoting again
    const res2 = await routeCommentService.upvoteComment(firstComment.id);
    expect(res2.upvotes).toBe(initialUpvotes + 1);
    expect(res2.alreadyVoted).toBe(true);
  });
});
