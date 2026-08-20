// Simple rule-based scoring engine for personalized event recommendations.
// Weighs: interest-category match, preferred city match, popularity
// (registrations + bookmarks), and how soon the event is happening.
function scoreEvents(events, { interestCategoryIds = [], preferredCity = null }) {
  const now = Date.now();

  return events
    .map((evt) => {
      let score = 0;

      // 1. Matches a selected interest category
      if (interestCategoryIds.includes(evt.category_id)) {
        score += 40;
      }

      // 2. Matches the user's preferred city
      if (preferredCity && evt.city && evt.city.toLowerCase() === preferredCity.toLowerCase()) {
        score += 20;
      }

      // 3. Popularity: registrations + bookmarks
      const popularity = Number(evt.registration_count || 0) + Number(evt.bookmark_count || 0);
      score += Math.min(popularity, 50) * 0.6; // cap influence

      // 4. Soonness: events happening sooner rank slightly higher
      const daysAway = (new Date(evt.event_date).getTime() - now) / (1000 * 60 * 60 * 24);
      if (daysAway >= 0) {
        score += Math.max(0, 15 - daysAway * 0.2);
      }

      return { ...evt, recommendation_score: Math.round(score * 100) / 100 };
    })
    .sort((a, b) => b.recommendation_score - a.recommendation_score);
}

module.exports = { scoreEvents };
