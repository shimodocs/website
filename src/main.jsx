import React from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Shell from './components/Shell'
import Home from './pages/Home'
import AIWorkspace from './pages/AIWorkspace'
import Blog from './pages/Blog'
import HelpCenter from './pages/HelpCenter'
import Pricing from './pages/Pricing'
import ContactSales from './pages/ContactSales'
import './styles.css'
function App(){return <BrowserRouter><Shell><Routes><Route path="/" element={<Home/>}/><Route path="/ai-workspace" element={<AIWorkspace/>}/><Route path="/blog" element={<Blog/>}/><Route path="/help-center" element={<HelpCenter/>}/><Route path="/pricing" element={<Pricing/>}/><Route path="/contact-sales" element={<ContactSales/>}/></Routes></Shell></BrowserRouter>}
createRoot(document.getElementById('root')).render(<App/>)
