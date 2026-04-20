import './App.css'
import {Editor} from '@monaco-editor/react';
import {MonacoBinding} from "y-monaco"
import { useRef, useMemo, useState, useEffect } from 'react';
import * as Y from 'yjs'
import {SocketIOProvider} from "y-socket.io"

function App() {
  const editorRef = useRef(null);
  const [userName, setUserName] = useState(
    () => new URLSearchParams(window.location.search).get("username") || ""
  );
  const [users, setUsers] = useState<string[]>([]);

  const ydoc = useMemo(() => new Y.Doc(), []);
  const yText = useMemo(() => ydoc.getText('monaco'), [ydoc]);

  const handleMount = (editor: any) => {
    editorRef.current = editor;

    new MonacoBinding(
      yText, 
      editorRef?.current.getModel(), 
      new Set([editorRef?.current]), 
    );
  }

  const handleNameChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUserName((e.target as any).username.value);
    window.history.pushState({}, "", "?username=" + (e.target as any).username.value);
  }

  useEffect(() => {
    if(userName) {
      const provider = new SocketIOProvider('http://localhost:3000', 'monaco', ydoc, {
      autoConnect: true
    });

    provider.awareness.setLocalStateField('user', {userName})

    const states = Array.from(provider.awareness.getStates().values());
    setUsers(
      states
        .filter((state: any) => state.user?.userName)
        .map((state: any) => state.user.userName)
    );

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(
        states
          .filter((state: any) => state.user?.userName)
          .map((state: any) => state.user.userName)
      );
    })

    function handleBeforeUnload() {
      provider.awareness.setLocalStateField('user', null);
    }

    window.addEventListener('beforeunload', handleBeforeUnload);
    }

  }, [userName])

  if(!userName) {
    return (
      <main className='h-screen w-full bg-gray-950 flex gap-4 p-4 items-center justify-center'>
        <form onSubmit={handleNameChange} className='flex flex-col gap-4'>
          <input
            type="text"
            placeholder='Enter your name'
            className='p-2 rounded-lg bg-gray-800 text-white'
            name='username'
          />
          <button className='p-2 rounded-lg bg-amber-500 text-black' type='submit'>Join</button>
        </form>
      </main>
    )
  }
  console.log("Users: ", users);

  return (
    <main className='h-screen w-full bg-gray-950 flex gap-4 p-4'>
      <aside className='h-full w-1/4 bg-amber-50 rounded-lg'>
        <h2 className='text-lg font-bold text-gray-700 p-4'>Users</h2>
        <ul className='p-4'>
          {users.map((user, index) => (
            <li key={index} className='text-black-500'>
              {user}
            </li>
          ))}
        </ul>
      
      </aside>
      <section className='w-3/4 bg-neutral-800 rounded-lg overflow-hidden'>
        <Editor height="100vh" 
          defaultLanguage="javascript" 
          defaultValue="// some comment" 
          theme='vs-dark'
          onMount={handleMount}
        />
      </section>
    </main>
  )
}

export default App
