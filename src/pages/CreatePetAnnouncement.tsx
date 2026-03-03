import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getAuthToken } from "../utils/auth"
import CreatePetAnnouncementForm from "../components/forms/CreatePetAnnouncementForm"

function CreatePetAnnouncement() {
    const navigate = useNavigate()

    useEffect(() => {
        const token = getAuthToken()
        if (!token) {
            navigate("/login", { replace: true })
        }
    }, [navigate])

    return (
        <>
            <CreatePetAnnouncementForm />
        </>
    )
}
export default CreatePetAnnouncement
