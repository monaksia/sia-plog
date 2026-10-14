import { reviewRoutes } from '../lib/reviews.js';
export default reviewRoutes({
  table: 'books', image: 'cover', imageRoute: 'cover',
  fields: ['title', 'title_en', 'author', 'cover', 'year', 'publisher', 'genre', 'rating', 'tags', 'excerpt', 'review'],
  arrays: ['genre', 'tags'],
});
