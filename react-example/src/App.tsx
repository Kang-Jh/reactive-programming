import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import './App.css';

function App() {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const [errorCount, setErrorCount] = useState(0);

  // 너무 잦은 요청은 부하가 심하니 타이핑 간격이 좁으면(< 500ms) 대기하다가 입력이 늦어지면 그때 서버에 요청하세요.
  useEffect(() => {
    const tid = setTimeout(() => {
      setQuery(value);
    }, 500);

    return () => {
      clearTimeout(tid);
    };
  }, [value]);

  // 데이터는 캐시로 보관을 해서 먼저 보여주고 요청이 완료되면 새로 갱신된 데이터를 보여주세요.
  const { data } = useSWR(
    `/auto-complete?q=${query}`,
    async (key) => {
      const { data } = await axios.get(key, {
        // 제한 시간
        timeout: 2000,
      });

      return data;
    },
    {
      onSuccess() {
        setErrorCount(0);
      },

      // 일정 시간(>= 2000ms) 동안 응답이 없으면 3회 재시도 하고
      errorRetryCount: 3,
      // 그래도 응답이 없으면 에러 메시지를 출력해 주세요
      onError() {
        setErrorCount((state) => state + 1);
      },
    }
  );

  // 엔터를 누르면 서버로 요청한 건 취소하고 검색 결과를 보여주세요.
  const onEnter = (e: any) => {
    if (e.key === 'Enter') {
      setQuery(value);
    }
  };

  return (
    <div className="App">
      {errorCount > 0 && errorCount % 3 === 0 && <div>요청 실패</div>}

      <ul>
        {data?.map((el: any) => (
          <li>{el}</li>
        ))}
      </ul>

      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={onEnter}
      />
    </div>
  );
}

export default App;
