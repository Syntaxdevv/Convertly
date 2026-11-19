import { useState } from "react";

import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";

import Hero from "./Hero";
import ToolsSection from "./ToolsSection";
import HowItWorks from "./HowItWorks";
import About from "./About";
import FAQ from "./FAQ";

export default function Home() {
  const [search, setSearch] = useState("");

  const handleSearchSubmit = () => {
    document.getElementById("tools")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  const handleClearSearch = () => {
    setSearch("");
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      <main>
        <Hero
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}/>

        <ToolsSection search="" onClearSearch={handleClearSearch} />
        <HowItWorks />

        <About />

        <FAQ />
      </main>

      <Footer />
    </div>
  );
}
