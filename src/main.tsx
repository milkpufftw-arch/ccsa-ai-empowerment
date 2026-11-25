import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import "@fontsource/noto-sans-tc/400.css";
import "@fontsource/noto-sans-tc/500.css";
import "@fontsource/noto-sans-tc/700.css";
import "./styles.css";
import Layout from "./components/Layout";
import { LibraryProvider } from "./data/library";
import { ContentProvider } from "./data/repository";
import {
  OrganizationDetail,
  AnnouncementDetail,
  AdminEntry,
} from "./pages/ManagedContent";
import Home from "./pages/Home";
import { Showcase, ShowcaseDetail, Resources } from "./pages/Library";
import {
  About,
  Seed,
  Courses,
  CourseDetail,
  NotFound,
} from "./pages/Content";
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ContentProvider>
      <LibraryProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="about" element={<About />} />
              <Route path="seed" element={<Seed />} />
              <Route path="organizations/:id" element={<OrganizationDetail />} />
              <Route path="announcements/:id" element={<AnnouncementDetail />} />
              <Route path="admin" element={<AdminEntry />} />
              <Route path="courses" element={<Courses />} />
              <Route path="courses/:id" element={<CourseDetail />} />
              <Route path="showcase" element={<Showcase />} />
              <Route path="showcase/:id" element={<ShowcaseDetail />} />
              <Route path="resources" element={<Resources />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </LibraryProvider>
    </ContentProvider>
  </React.StrictMode>,
);
