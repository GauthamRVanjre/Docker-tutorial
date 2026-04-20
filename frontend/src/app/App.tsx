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
  }

  const handleNameChange = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUserName((e.target as any).username.value);
    window.history.pushState({}, "", "?username=" + (e.target as any).username.value);
  }

  useEffect(() => {
    if(userName && editorRef.current) {
      const provider = new SocketIOProvider('http://localhost:3000', 'monaco', ydoc, {
      autoConnect: true
    });

    provider.awareness.setLocalStateField('user', {
      name: userName,
      color: '#' + Math.floor(Math.random()*16777215).toString(16)
    });

    provider.awareness.on('change', () => {
      const states = Array.from(provider.awareness.getStates().values());
      setUsers(states.map((state: any) => state.user).filter(user => Boolean(user.username)));
    })

    const monacoBinding = new MonacoBinding(
      yText, 
      editorRef?.current.getModel(), 
      new Set([editorRef?.current]), 
      provider.awareness
    );
    }
  }, [editorRef.current])

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

  return (
    <main className='h-screen w-full bg-gray-950 flex gap-4 p-4'>
      <aside className='h-full w-1/4 bg-amber-50 rounded-lg'></aside>
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
