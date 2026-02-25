import { Routes, Route } from "react-router-dom"
import LoginPage from "../pages/LoginPage"
import HomePage from "../pages/home"

function AppRoute() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
        </Routes>
    )
}

export default AppRoute