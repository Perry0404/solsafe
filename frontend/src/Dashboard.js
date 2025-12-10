import React, { useEffect } from "react";

export default function Dashboard() {

  useEffect(() => {
    const adjustLayout = () => {
      const width = window.innerWidth;
      if (width < 768) {
        document.body.classList.add("dash-mobile");
        document.body.classList.remove("dash-tablet", "dash-desktop");
      } else if (width >= 768 && width <= 1024) {
        document.body.classList.add("dash-tablet");
        document.body.classList.remove("dash-mobile", "dash-desktop");
      } else {
        document.body.classList.add("dash-desktop");
        document.body.classList.remove("dash-mobile", "dash-tablet");
      }
    };

    const fixIOSHeight = () => {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty("--vh", `${vh}px`);
    };

    adjustLayout();
    fixIOSHeight();

    window.addEventListener("resize", adjustLayout);
    window.addEventListener("orientationchange", fixIOSHeight);

    return () => {
      window.removeEventListener("resize", adjustLayout);
      window.removeEventListener("orientationchange", fixIOSHeight);
    };
  }, []);

  return (
    <div className="dashboard-shell">

      <style>{`
        .dashboard-shell { display: flex; width: 100%; min-height: calc(var(--vh, 1vh) * 100); }

        .sidebar {
          width: 260px;
          background: #1a0026;
          padding: 25px;
          color: white;
          min-height: 100%;
        }

        .content {
          flex: 1;
          padding: 40px;
          background: #f7f7f7;
        }

        body.dash-mobile .dashboard-shell { flex-direction: column; padding: 10px 0; }
        body.dash-mobile .sidebar { width: 100%; margin-bottom: 20px; }
        body.dash-mobile .content { padding: 20px; }

        body.dash-tablet .dashboard-shell { flex-direction: column; }

        :root { height: calc(var(--vh, 1vh) * 100); }
      `}</style>

      <div className="sidebar">
        Dashboard Sidebar
      </div>

      <div className="content">
        Dashboard Content
      </div>

    </div>
  );
}
