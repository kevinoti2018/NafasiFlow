// components/SiteLayout.tsx
import Navbar from "@/components/navigation/NavBar";
import Footer from "@/components/navigation/Footer";
import React from "react";

export const SiteLayout = ({
  children,
}: Readonly<{ children: React.ReactNode }>) => {
  return (
    <main>
      <Navbar />
      {children}
      <Footer />
    </main>
  );
};
