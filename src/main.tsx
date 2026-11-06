import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@fontsource/noto-sans-tc/400.css";
import "@fontsource/noto-sans-tc/500.css";
import "@fontsource/noto-sans-tc/700.css";
import "./styles.css";
import Layout from "./components/Layout";
import Home from "./pages/Home";
import {
  About,
  Seed,
  Courses,
  CourseDetail,
  Showcase,
  ShowcaseDetail,
  Resources,
  NotFound,
} from "./pages/Content";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="about" element={<About />} />
          <Route path="seed" element={<Seed />} />
          <Route path="courses" element={<Courses />} />
          <Route path="courses/:id" element={<CourseDetail />} />
          <Route path="showcase" element={<Showcase />} />
          <Route path="showcase/:id" element={<ShowcaseDetail />} />
          <Route path="resources" element={<Resources />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
);
