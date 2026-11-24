
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Analytics } from "@vercel/analytics/react";
import Home from "./pages/Home";
import Converter from "./pages/Converter";
import CustomCursor from "./components/animations/CustomCursor";

function App() {
    return (
        <BrowserRouter>
            <div className="cursor-none">
                <CustomCursor />

                <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/convert/:slug" element={<Converter />} />
                </Routes>
                <Analytics />
            </div>
        </BrowserRouter>
    );
}

export default App;
