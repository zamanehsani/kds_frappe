import { useState } from "react";
import { useKDS } from "../../hooks/useKDS";
import { logoutFrappe } from "../auth/api/session";
import { MenuPage } from "../../components/Admin/MenuPage";
// import OrdersPage from "../../components/Admin/OrdersPage"
import HomePage from "../../components/Admin/HomePage";
import  Sidebar  from "../../components/Admin/Sidebar";


export default function KDSAdminPage() {
  const { orders } = useKDS();
  // const { orders, bump } = useKDS();
  const [activePage, setActivePage] = useState("home");

  return (
    <div className="min-h-screen bg-[#f8f9fa] flex">
      <Sidebar
        activePage={activePage}
        onNavigate={setActivePage}
        onLogout={() => logoutFrappe("/kds/login")}
      />
      <main className="flex-1 ml-[72px] min-h-screen p-6 sm:p-8 overflow-auto">
        {activePage === "home" && <HomePage orders={orders} />}
        {/* {activePage === "orders" && <OrdersPage orders={orders} bump={bump} />} */}
        {activePage === "menu" && <MenuPage />}
      </main>
    </div>
  );
}
