import { Outlet } from "react-router-dom"
import Navbar from "../components/Navbar"
import FooterFixed from "../components/FooterFixed";

const MainLayout = () => {
    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', color: 'var(--color-text)' }}>
            <Navbar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '40px 24px 64px' }}>
                <Outlet />
            </div>
            <FooterFixed />
        </div>
    )
}

export default MainLayout
