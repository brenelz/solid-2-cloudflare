import { createMemo } from 'solid-js'
import './App.css'

export const getMessage = async function () {
  "use server";
  console.log('on server');
  return "Hello, world!";
}

function App() {
  const message = createMemo(() => getMessage())
  return (
    <>
      <span>{message()}</span>
    </>
  )
}

export default App
