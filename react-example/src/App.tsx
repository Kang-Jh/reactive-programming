import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import useSWR from 'swr';
import './App.css';

function App() {
  const [value, setValue] = useState('');
  const [query, setQuery] = useState('');
  const [errorCount, setErrorCount] = useState(0);
  const { data } = useSWR(
    `/auto-complete?q=${query}`,
    async (key) => {
      const { data } = await axios.get(key, {
        timeout: 2000,
      });

      return data;
    },
    {
      onSuccess() {
        setErrorCount(0);
      },
      onError() {
        setErrorCount((state) => state + 1);
      },
      errorRetryCount: 3,
    }
  );

  useEffect(() => {
    const tid = setTimeout(() => {
      setQuery(value);
    }, 500);

    return () => {
      clearTimeout(tid);
    };
  }, [value]);

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
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            setQuery(value);
          }
        }}
      />
    </div>
  );
}

export default App;
