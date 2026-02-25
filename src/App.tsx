import Home from './pages/home'
import './assets/styles/App.css'
import Header from './components/layout/header'
import { BrowserRouter } from 'react-router-dom'

function App() {

  return (
    <>
      <BrowserRouter>
        <Header />
        <Home />
      </BrowserRouter>
    </>
  )
}

export default App
