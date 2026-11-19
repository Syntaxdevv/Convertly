
import { BrowserRouter, Routes, Route } from "react-router-dom";
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
            </div>
        </BrowserRouter>
    );
}

export default App;
