import { reviewRoutes } from '../lib/reviews.js';
export default reviewRoutes({
  table: 'movies', image: 'poster', imageRoute: 'poster',
  fields: ['title', 'title_en', 'poster', 'year', 'director', 'cast', 'genre', 'rating', 'tags', 'excerpt', 'review'],
  arrays: ['cast', 'genre', 'tags'],
});
