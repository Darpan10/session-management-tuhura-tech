import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

// Background prefetch: load heavy chunks (FullCalendar and calendar page) when the browser is idle
const idleCallback = (cb: () => void) => {
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(cb, { timeout: 2000 })
  } else {
    setTimeout(cb, 2000)
  }
}

idleCallback(() => {
  // Prefetch the FullCalendar chunk and CalendarView component so first navigation is smooth
  import('@fullcalendar/core').catch(() => {})
  import('@fullcalendar/react').catch(() => {})
  import('./pages/admin/CalendarView').catch(() => {})
})
