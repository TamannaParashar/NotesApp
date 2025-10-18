import React from 'react'
import Home from './Components/Home'
import { Routes,Route } from 'react-router-dom'
import Chat from './Components/Chat'
import About from './Components/About'

export default function App() {
  return (
    <div>
      <Routes>
        <Route element={<Home/>} path='/'></Route>
        <Route element={<Chat/>} path='/chat'></Route>
        <Route element={<About/>} path='/about'></Route>
      </Routes>
    </div>
  )
}
