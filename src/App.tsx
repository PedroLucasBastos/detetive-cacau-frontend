
import AppRoute from './routes/appRoute'
import './assets/styles/App.css'
import Header from './components/layout/header'
import { BrowserRouter } from 'react-router-dom'

function App() {

  return (
    <>
      <BrowserRouter>
        <Header />
        <AppRoute />

      </BrowserRouter>
    </>
  )
}

export default App
