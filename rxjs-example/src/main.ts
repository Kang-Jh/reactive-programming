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
    // 너무 잦은 요청은 부하가 심하니 타이핑 간격이 좁으면(< 500ms) 대기하다가 입력이 늦어지면 그때 서버에 요청하세요.
    debounceTime(500),
    // 같은 내용일때는 요청하지 마세요.
    distinctUntilChanged(),
    // 기존 요청을 취소하기 위한 사이드 이펙트
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
        // 일정 시간(>= 2000ms) 동안 응답이 없으면
        timeout(2000),
        //  3회 재시도 하고
        retry(3),
        //  그래도 응답이 없으면 에러 메시지를 출력해 주세요
        catchError((err) => {
          if (err.name !== 'AbortError') {
            alert('Time out');
          }

          return of([]);
        })
      )
    )
  )
  .subscribe((value) => console.log('fetch result: ', value));

// 데이터는 캐시로 보관을 해서 먼저 보여주고 요청이 완료되면 새로 갱신된 데이터를 보여주세요.
inputValue$.subscribe((value) => console.log('cache result: ', cache[value]));

enterKeydownEvent$.subscribe(() => {
  autoCompleteAbortController.abort();
  autoCompleteAbortController = new AbortController();
});

root.appendChild(input);
