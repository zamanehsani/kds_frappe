import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'


import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'


const renderApp = () => {
  const rootElement = document.getElementById('root');
  if (rootElement) {
    createRoot(rootElement).render(
      <StrictMode>
        <App />
        {/* 2. Global Toast Layout Framework Hook */}
        <ToastContainer
          position="bottom-right"
          autoClose={3500}
          hideProgressBar={false}
          newestOnTop={true}
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
        />
      </StrictMode>,
    )
  } else {
    // Check again in 50ms if Frappe hasn't rendered the wrapper yet
    setTimeout(renderApp, 50);
  }
}

renderApp();