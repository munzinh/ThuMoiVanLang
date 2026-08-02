"use client";

import { useState, useEffect, useCallback } from "react";
import styles from "./admin.module.css";
import { StarField } from "@/components/StarField";
import { EVENT_CONFIG } from "@/config/event";

interface Guest {
  id: string;
  name: string;
  slug: string;
  refusalCount?: number;
  createdAt: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [pwError, setPwError] = useState("");

  const [guests, setGuests] = useState<Guest[]>([]);
  const [newName, setNewName] = useState("");
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [notification, setNotification] = useState<{ msg: string; type: "success" | "error" } | null>(null);

  const showNotif = (msg: string, type: "success" | "error" = "success") => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3000);
  };

  const fetchGuests = useCallback(async () => {
    const res = await fetch("/api/guests");
    const data = await res.json();
    setGuests(data);
  }, []);

  useEffect(() => {
    const savedAuth = sessionStorage.getItem("admin_auth");
    if (savedAuth === "true") {
      setIsAuthenticated(true);
      fetchGuests();
    }
  }, [fetchGuests]);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === EVENT_CONFIG.adminPassword) {
      setIsAuthenticated(true);
      sessionStorage.setItem("admin_auth", "true");
      fetchGuests();
      setPwError("");
    } else {
      setPwError("Mật khẩu không đúng! Thử lại.");
      setPassword("");
    }
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) { setAddError("Vui lòng nhập tên khách mời!"); return; }
    setAdding(true);
    setAddError("");
    const res = await fetch("/api/guests", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    if (res.ok) {
      setNewName("");
      await fetchGuests();
      showNotif("✓ Đã thêm khách mời thành công!");
    } else {
      setAddError("Lỗi khi thêm. Thử lại.");
    }
    setAdding(false);
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Xóa "${name}" khỏi danh sách?`)) return;
    setDeletingId(id);
    const res = await fetch(`/api/guests?id=${id}`, { method: "DELETE" });
    if (res.ok) {
      await fetchGuests();
      showNotif("✓ Đã xóa khách mời!", "error");
    }
    setDeletingId(null);
  };

  const handleCopy = (slug: string, id: string) => {
    const url = `${window.location.origin}/${slug}`;
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    showNotif("✓ Đã copy link!");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredGuests = guests.filter((g) =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getBaseUrl = () => typeof window !== "undefined" ? window.location.origin : "";

  if (!isAuthenticated) {
    return (
      <div className={styles.loginPage}>
        <StarField count={20} />

        <form onSubmit={handleLogin} className={styles.loginBox + " pixel-box z-content"}>
          <div className={styles.loginIcon}>🔐</div>
          <h1 className="pixel-title" style={{ fontSize: 16, textAlign: "center" }}>
            Admin Panel
          </h1>
          <p className="pixel-text" style={{ color: "var(--text-secondary)", fontSize: 18, textAlign: "center" }}>
            Nhập mật khẩu để tiếp tục
          </p>
          <div className={styles.inputGroup}>
            <label className="pixel-label">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="pixel-input"
              placeholder="Nhập mật khẩu..."
              autoFocus
            />
          </div>
          {pwError && (
            <p className="pixel-label" style={{ color: "var(--pixel-red)" }}>
              ✗ {pwError}
            </p>
          )}
          <button type="submit" className="pixel-btn" style={{ width: "100%", justifyContent: "center" }}>
            ► Đăng Nhập
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className={styles.adminPage}>
      <StarField count={15} />

      {/* Notification */}
      {notification && (
        <div className={`${styles.notification} ${notification.type === "error" ? styles.notifError : styles.notifSuccess}`}>
          {notification.msg}
        </div>
      )}

      {/* Ticker */}
      <div className="pixel-ticker">
        <div className="pixel-ticker-inner">
          ★ ADMIN PANEL ★ &nbsp;&nbsp;&nbsp; QUẢN LÝ DANH SÁCH KHÁCH MỜI &nbsp;&nbsp;&nbsp;
          ★ ADMIN PANEL ★ &nbsp;&nbsp;&nbsp; QUẢN LÝ DANH SÁCH KHÁCH MỜI &nbsp;&nbsp;&nbsp;
        </div>
      </div>

      <main className={`${styles.main} z-content`}>
        {/* Header */}
        <header className={styles.header}>
          <div>
            <h1 className="pixel-title" style={{ fontSize: "clamp(14px, 3vw, 22px)" }}>
              ⚙ Admin Panel
            </h1>
            <p className="pixel-text" style={{ color: "var(--text-secondary)", fontSize: 18 }}>
              {EVENT_CONFIG.eventTitle}
            </p>
          </div>
          <button
            className="pixel-btn pixel-btn-red"
            style={{ fontSize: 9 }}
            onClick={() => {
              sessionStorage.removeItem("admin_auth");
              setIsAuthenticated(false);
            }}
          >
            Đăng Xuất
          </button>
        </header>

        {/* Stats */}
        <div className={styles.statsRow}>
          <div className={styles.statCard + " pixel-box-purple"}>
            <span className={styles.statNumber}>{guests.length}</span>
            <span className="pixel-label">Tổng khách mời</span>
          </div>
          <div className={styles.statCard + " pixel-box-purple"}>
            <span className={styles.statNumber} style={{ color: "var(--pixel-cyan)" }}>
              {filteredGuests.length}
            </span>
            <span className="pixel-label">Kết quả tìm kiếm</span>
          </div>
          <div className={styles.statCard + " pixel-box-purple"}>
            <span className={styles.statNumber} style={{ color: "var(--pixel-red, #ff4757)" }}>
              {guests.reduce((sum, g) => sum + (g.refusalCount || 0), 0)}
            </span>
            <span className="pixel-label">Lượt ấn/né từ chối</span>
          </div>
        </div>

        {/* Add Guest */}
        <section className={styles.addSection + " pixel-box"}>
          <h2 className="pixel-subtitle" style={{ marginBottom: 20 }}>► Thêm Khách Mời Mới</h2>
          <form onSubmit={handleAdd} className={styles.addForm}>
            <div className={styles.inputGroup}>
              <label className="pixel-label">Tên đầy đủ</label>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="pixel-input"
                placeholder="VD: Thầy Nguyễn Văn Bình..."
              />
            </div>
            <button
              type="submit"
              className="pixel-btn pixel-btn-green"
              disabled={adding}
              style={{ alignSelf: "flex-end", whiteSpace: "nowrap" }}
            >
              {adding ? "Đang thêm..." : "+ Thêm"}
            </button>
          </form>
          {addError && <p className="pixel-label" style={{ color: "var(--pixel-red)", marginTop: 8 }}>✗ {addError}</p>}
        </section>

        {/* Search */}
        <div className={styles.searchRow}>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pixel-input"
            placeholder="🔍 Tìm theo tên..."
          />
        </div>

        {/* Guest List */}
        <section className={styles.tableSection + " pixel-box"}>
          <h2 className="pixel-subtitle" style={{ marginBottom: 20 }}>
            ► Danh Sách Khách Mời ({filteredGuests.length})
          </h2>

          {filteredGuests.length === 0 ? (
            <div className={styles.emptyState}>
              <span style={{ fontSize: 48 }}>📭</span>
              <p className="pixel-text" style={{ color: "var(--text-secondary)" }}>
                {searchTerm ? "Không tìm thấy kết quả" : "Chưa có khách mời nào"}
              </p>
            </div>
          ) : (
            <div className={styles.tableWrapper}>
              <table className="pixel-table">
                <thead>
                  <tr>
                    <th>STT</th>
                    <th>Tên Khách Mời</th>
                    <th>Link Thư Mời</th>
                    <th style={{ textAlign: "center" }}>Lượt Né/Từ Chối</th>
                    <th>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredGuests.map((guest, idx) => (
                    <tr key={guest.id}>
                      <td style={{ color: "var(--text-secondary)", fontFamily: "'Press Start 2P', monospace", fontSize: 10 }}>
                        {String(idx + 1).padStart(2, "0")}
                      </td>
                      <td>
                        <span style={{ color: "var(--pixel-gold)", fontWeight: "bold" }}>
                          {guest.name}
                        </span>
                      </td>
                      <td>
                        <a
                          href={`/${guest.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={styles.slugLink}
                        >
                          /{guest.slug}
                        </a>
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <span
                          style={{
                            display: "inline-block",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            backgroundColor: (guest.refusalCount || 0) > 0 ? "#ff475722" : "#ffffff11",
                            color: (guest.refusalCount || 0) > 0 ? "#ff4757" : "#aaa",
                            fontWeight: "bold",
                            border: `1px solid ${(guest.refusalCount || 0) > 0 ? "#ff475766" : "#444"}`
                          }}
                        >
                          {guest.refusalCount || 0} lần
                        </span>
                      </td>
                      <td>
                        <div className={styles.actionBtns}>
                          <button
                            className={`pixel-btn pixel-btn-cyan ${styles.smallBtn}`}
                            onClick={() => handleCopy(guest.slug, guest.id)}
                            title="Copy link"
                          >
                            {copiedId === guest.id ? "✓" : "📋"}
                          </button>
                          <button
                            className={`pixel-btn pixel-btn-red ${styles.smallBtn}`}
                            onClick={() => handleDelete(guest.id, guest.name)}
                            disabled={deletingId === guest.id}
                            title="Xóa"
                          >
                            {deletingId === guest.id ? "..." : "✕"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Preview note */}
        <div className={styles.previewNote + " pixel-box-purple"}>
          <span className="pixel-label">💡 Hướng dẫn sử dụng</span>
          <ul className="pixel-text" style={{ fontSize: 18, marginTop: 10, paddingLeft: 20, display: "flex", flexDirection: "column", gap: 8 }}>
            <li>Nhấn <span style={{ color: "var(--pixel-gold)" }}>📋</span> để copy link gửi cho khách</li>
            <li>Link mẫu: <span style={{ color: "var(--pixel-cyan)" }}>{getBaseUrl()}/ten-khach-moi</span></li>
            <li>Mỗi người sẽ thấy tên của họ trên thư mời</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
