// src/mocks/handlers.js

import { rest } from 'msw';

const list = [
  'instagram',
  'intp',
  'intj',
  'icloud',
  'istp',
  'isfj',
  'isfp',
  'iportfolio',
];

let ipfCounter = 0;

export const handlers = [
  rest.get('/auto-complete', (req, res, ctx) => {
    const query = req.url.searchParams.get('q');

    if (!query) {
      return res(ctx.delay(500), ctx.status(200), ctx.json([]));
    }

    if (!query.startsWith('i')) {
      return res(ctx.delay(5000), ctx.status(200), ctx.json([]));
    }

    if (query === 'iportfolio') {
      ipfCounter += 1;
    }

    if (ipfCounter > 1) {
      return res(
        ctx.delay(500),
        ctx.status(200),
        ctx.json(['iportfolio', 'iportfolio career'])
      );
    }

    return res(
      ctx.delay(500),
      ctx.status(200),
      ctx.json(list.filter((i) => i.startsWith(query)))
    );
  }),
];
