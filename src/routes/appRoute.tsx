import { Routes, Route } from "react-router-dom"
import LoginPage from "../pages/LoginPage"
import HomePage from "../pages/home"
import ProfileUser from "../pages/profileUser"
import CreateAccoutPage from "../pages/CreateAccoutPage"

function AppRoute() {
    return (
        <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/profile" element={<ProfileUser />} />
            <Route path="/create-account" element={<CreateAccoutPage />} />
        </Routes>
    )
}

export default AppRoute