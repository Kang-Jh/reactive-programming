import {
  timeout,
  retry,
  fromEvent,
  from,
  map,
  debounceTime,
  distinctUntilChanged,
  mergeMap,
  tap,
  filter,
  share,
  catchError,
  of,
} from 'rxjs';
import { fromFetch } from 'rxjs/fetch';
import { worker } from './mocks/browser';
import './style.css';

worker.start();

const root = document.getElementById('app') as HTMLDivElement;
const input = document.createElement('input');
let cache: { [key: string]: string[] } = {};

const inputValue$ = fromEvent(input, 'input').pipe(
  map((e) => (e.target as HTMLInputElement).value),
  share()
);
const enterKeydownEvent$ = fromEvent(input, 'keydown').pipe(
  filter((e) => (e as any).key === 'Enter')
);

let autoCompleteAbortController = new AbortController();

inputValue$
  .pipe(
    debounceTime(500),
    distinctUntilChanged(),
    tap(() => {
      autoCompleteAbortController.abort();
      autoCompleteAbortController = new AbortController();
    }),
    mergeMap((text) =>
      fromFetch(`/auto-complete?q=${text}`, {
        signal: autoCompleteAbortController.signal,
      }).pipe(
        mergeMap((response) => from(response.json())),
        tap((value) => (cache = { ...cache, [text]: value })),
        timeout(2000),
        retry(3),
        catchError(() => of([]))
      )
    )
  )
  .subscribe((fetchResult) => console.log(`fetch result: `, fetchResult));

inputValue$.subscribe((value) => console.log('cache result: ', cache[value]));

enterKeydownEvent$.subscribe(() => {
  autoCompleteAbortController.abort();
  autoCompleteAbortController = new AbortController();
});

root.appendChild(input);
