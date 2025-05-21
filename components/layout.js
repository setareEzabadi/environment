import Header from "./Header/Header";
import Footer from "./Footer/Footer";
import { useRouter } from "next/router";

export default function Layout({ children }) {
  const router = useRouter();

  const hideFooter = router.pathname === "/dashboard";
  const hideHeader = router.pathname === "/dashboard";

  return (
    <>
      {!hideHeader && <Header />}
      <main>{children}</main>
      {!hideFooter && <Footer />}
    </>
  );
}
