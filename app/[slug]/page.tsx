"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";
import { EVENT_CONFIG } from "@/config/event";
import styles from "./invitation.module.css";

interface Guest { id: string; name: string; slug: string; }
type Step = "envelope" | "invitation" | "info";

/* ── Sparkle pixel decorations ── */
const SPARKLES = [
  { top: "8%", left: "8%", dur: "2.1s", del: "0s" },
  { top: "12%", right: "10%", dur: "1.8s", del: "0.4s" },
  { top: "35%", left: "4%", dur: "2.5s", del: "0.8s" },
  { top: "40%", right: "5%", dur: "2.2s", del: "0.2s" },
  { top: "65%", left: "6%", dur: "1.9s", del: "1s" },
  { top: "70%", right: "8%", dur: "2.3s", del: "0.6s" },
];

function SparkleDecor() {
  return (
    <>
      {SPARKLES.map((s, i) => (
        <span
          key={i}
          className={`${styles.sparkle} anim-sparkle`}
          style={{
            top: s.top, left: (s as any).left, right: (s as any).right,
            "--dur": s.dur, "--del": s.del
          } as React.CSSProperties}
        >✦</span>
      ))}
    </>
  );
}

export default function InvitationPage({ params }: { params: Promise<{ slug: string }> }) {
  const [guest, setGuest] = useState<Guest | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [step, setStep] = useState<Step>("envelope");
  const [envelopeOpening, setEnvelopeOpening] = useState(false);
  const [slug, setSlug] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => { params.then((p) => setSlug(p.slug)); }, [params]);

  useEffect(() => {
    if (!slug) return;
    (async () => {
      try {
        const res = await fetch(`/api/guests?slug=${slug}`);
        if (res.ok) { setGuest(await res.json()); }
        else { setNotFound(true); }
      } catch { setNotFound(true); }
      finally { setLoading(false); }
    })();
  }, [slug]);

  const [dodgePos, setDodgePos] = useState<{ x: number; y: number } | null>(null);

  const recordRefusal = () => {
    if (!slug) return;
    try {
      fetch("/api/guests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      }).catch(() => {});
    } catch {}
  };

  const dodgeButton = (e?: React.SyntheticEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    const screenW = typeof window !== "undefined" ? window.innerWidth : 360;
    const screenH = typeof window !== "undefined" ? window.innerHeight : 600;

    const maxX = Math.max(70, Math.min(120, (screenW - 150) / 2));
    const maxY = Math.max(100, Math.min(200, (screenH - 250) / 2));

    let rx = (Math.random() - 0.5) * 2 * maxX;
    let ry = (Math.random() - 0.5) * 2 * maxY;

    setDodgePos({ x: rx, y: ry });
    recordRefusal();
  };

  /* ── Confetti ── */
  const launchConfetti = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d")!;
    const colors = ["#C41E3A", "#F0C878", "#E8B4B8", "#C8943E", "#fff"];
    let ps = Array.from({ length: 80 }, (_, i) => ({
      x: Math.random() * canvas.width, y: -20,
      color: colors[i % colors.length],
      size: (Math.floor(Math.random() * 6) + 1) * 6,
      vx: (Math.random() - 0.5) * 4, vy: Math.random() * 3 + 2, life: 1,
    }));
    const tick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ps = ps.map(p => ({ ...p, x: p.x + p.vx, y: p.y + p.vy, life: p.life - 0.008 }))
        .filter(p => p.life > 0 && p.y < canvas.height);
      ps.forEach(p => { ctx.globalAlpha = p.life; ctx.fillStyle = p.color; ctx.fillRect(p.x, p.y, p.size, p.size); });
      if (ps.length > 0) animRef.current = requestAnimationFrame(tick);
      else { ctx.globalAlpha = 1; ctx.clearRect(0, 0, canvas.width, canvas.height); }
    };
    animRef.current = requestAnimationFrame(tick);
  };
  useEffect(() => () => cancelAnimationFrame(animRef.current), []);

  /* ── Open envelope ── */
  const handleOpenEnvelope = () => {
    if (envelopeOpening) return;
    setEnvelopeOpening(true);
    setTimeout(() => {
      setStep("invitation");
      launchConfetti();
    }, 700);
  };

  /* ── LOADING ── */
  if (loading) return (
    <div className={styles.loadingScreen}>
      <div className={styles.loadingBox}>
        <p className={styles.loadingText}>Đang tải thư mời...</p>
        <span className={`${styles.loadingCursor} anim-blink`}>▮</span>
      </div>
    </div>
  );

  /* ── 404 ── */
  if (notFound) return (
    <div className={styles.loadingScreen}>
      <div className={styles.notFoundBox}>
        <div className={styles.errorCode}>404</div>
        <p className={styles.errorMsg}>Không tìm thấy thư mời.<br />Vui lòng kiểm tra lại link.</p>
      </div>
    </div>
  );

  /* ══════════════════════════════
     STEP 1 — ENVELOPE (FIRST SCREEN)
  ══════════════════════════════ */
  if (step === "envelope") return (
    <div className={styles.envelopeScreen}>
      <canvas ref={canvasRef} className={styles.confetti} />
      <SparkleDecor />

      {/* Header Badge */}
      <div className={`${styles.envHeaderBlock} anim-fadein`}>
        <span className={styles.envUnivBadge}>VAN LANG UNIVERSITY</span>
        <h1 className={styles.envMainTitle}>THƯ MỜI TỐT NGHIỆP</h1>
        <div className={styles.envSubFrom}>
          <span className={styles.envFromLabel}>from</span>
          <span className={styles.envOwnerName}>{EVENT_CONFIG.ownerName}</span>
        </div>
      </div>

      {/* Envelope Card */}
      <button
        className={`${styles.envelopeBtn} ${envelopeOpening ? styles.envelopeOpening : ""}`}
        onClick={handleOpenEnvelope}
        aria-label="Mở thư mời"
      >
        <div className={styles.envelopeBody}>
          <div className={`${styles.envFlap} ${envelopeOpening ? styles.envFlapOpen : ""}`} />
          <div className={styles.envFront}>
            <div className={styles.envSeal}>
              <h1>❤️‍🔥</h1>
            </div>
          </div>
          {envelopeOpening && (
            <div className={styles.envLetter}>
              <span>TRÂN TRỌNG KÍNH MỜI</span>
            </div>
          )}
        </div>
      </button>

      {/* Tap hint & Action buttons */}
      <div className={styles.envTapHint} style={{ opacity: envelopeOpening ? 0 : 1 }}>

      </div>

      <div className={styles.envActionRow} style={{ opacity: envelopeOpening ? 0 : 1 }}>
        <button
          className={styles.envAcceptBtn}
          onClick={handleOpenEnvelope}
        >
          Ấn vào bao thư
        </button>

        <button
          className={styles.envRefuseBtn}
          onMouseEnter={dodgeButton}
          onTouchStart={dodgeButton}
          onClick={dodgeButton}
          style={dodgePos ? {
            transform: `translate(${dodgePos.x}px, ${dodgePos.y}px)`,
            transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
            position: "relative",
            zIndex: 20,
          } : {
            transition: "transform 0.15s cubic-bezier(0.175, 0.885, 0.32, 1.275)",
          }}
        >
          Từ chối tham dự
        </button>
      </div>

      {/* Bottom elegant line */}
      <div className={styles.envBottomDeco}>
        <div className={styles.envLine} />
        <span className={styles.envStar}>✦</span>
        <div className={styles.envLine} />
      </div>
    </div>
  );

  /* ══════════════════════════════
     STEP 2 — INVITATION
  ══════════════════════════════ */
  if (step === "invitation") return (
    <div className={styles.invitePage}>
      <canvas ref={canvasRef} className={styles.confetti} />
      <SparkleDecor />

      {/* Background image */}
      <div className={styles.bgLayer}>
        <Image src={EVENT_CONFIG.backgroundUrl || "/bg-graduation.png"} alt="" fill style={{ objectFit: "cover", objectPosition: "center" }} priority />
        <div className={styles.bgOverlay} />
      </div>

      <div className={styles.inviteScroll}>

        {/* Header Badge */}
        <div className={`${styles.inviteHeader} anim-fadein`}>
          <span className={styles.vlLogoSingleLine}>VAN LANG UNIVERSITY</span>
        </div>

        {/* Guest Greeting */}
        <div className={`${styles.inviteTitle} anim-fadeup`}>
          <p className={styles.inviteTitleSub}>THÂN MỜI</p>
          <h1 className={styles.guestNameBig}>{guest?.name}</h1>
          <p className={styles.inviteTitleSub2}>đến tham dự</p>
        </div>

        {/* Event Title Box */}
        <div className={`${styles.eventTitleBox} anim-fadeup`} style={{ animationDelay: "0.15s" }}>
          <h2 className={styles.eventBig}>LỄ TỐT NGHIỆP</h2>
          <p className={styles.eventScript}>Graduation Ceremony</p>
        </div>

        {/* Owner Avatar & Name */}
        <div className={`${styles.ownerBlock} anim-fadeup`} style={{ animationDelay: "0.25s" }}>
          <div className={styles.ownerAvatarWrapper}>
            <Image
              src={EVENT_CONFIG.ownerPhotoUrl}
              alt={EVENT_CONFIG.ownerName}
              width={90}
              height={90}
              className={styles.ownerAvatarImg}
            />
          </div>
          <p className={styles.ownerFrom}>from</p>
          <p className={styles.ownerNameText}>{EVENT_CONFIG.ownerName}</p>
        </div>

        {/* Time & Date Pills */}
        <div className={`${styles.timeDateRow} anim-fadeup`} style={{ animationDelay: "0.35s" }}>
          <div className={styles.pill}>
            <span>{EVENT_CONFIG.timeDisplay}</span>
          </div>
          <div className={styles.pill}>
            <span>06.08.2026</span>
          </div>
        </div>

        {/* Cheesy thank you message */}
        <div className={`${styles.thankBox} anim-fadeup`} style={{ animationDelay: "0.45s" }}>
          <p className={styles.thankText}>
            Thanh xuân của mình sẽ thật sự rực rỡ và trọn vẹn hơn khi có nụ cười của bạn ghé thăm. Sự xuất hiện của bạn chính là món quà ý nghĩa nhất dành cho mình trong cột mốc đặc biệt này.
          </p>
          <p className={styles.thankScript}>Thank you !</p>
        </div>

        {/* CTA Button */}
        <div className={`${styles.ctaBlock} anim-fadeup`} style={{ animationDelay: "0.55s" }}>
          <button
            className={`px-btn px-btn-red ${styles.ctaBtn}`}
            onClick={() => setStep("info")}
          >
            Xem thông tin chi tiết
          </button>
        </div>
      </div>
    </div>
  );

  /* ══════════════════════════════
     STEP 3 — INFO
  ══════════════════════════════ */
  return (
    <div className={styles.infoPage}>
      <SparkleDecor />

      {/* Header */}
      <div className={styles.infoHeader}>
        <button className={styles.backBtn} onClick={() => setStep("invitation")}>
          ← Quay lại
        </button>
        <div className={styles.infoHeaderTitle}>
          <span>Thông tin buổi lễ</span>
        </div>
      </div>

      <div className={styles.infoScroll}>

        {/* Event info card */}
        <div className={`${styles.infoCard} px-box anim-fadeup`}>
          <div className={styles.infoCardTitle}>► THÔNG TIN</div>

          <div className={styles.infoRow}>
            <div>
              <span className={styles.infoLabel}>Sự kiện</span>
              <span className={styles.infoValue}>{EVENT_CONFIG.eventTitle}</span>
            </div>
          </div>

          <div className={styles.infoRow}>
            <div>
              <span className={styles.infoLabel}>Trường</span>
              <span className={styles.infoValue}>{EVENT_CONFIG.university}</span>
            </div>
          </div>

          <div className={styles.infoRow}>
            <div>
              <span className={styles.infoLabel}>Thời gian</span>
              <span className={`${styles.infoValue} ${styles.infoValueRed}`}>{EVENT_CONFIG.dateDisplay}</span>
              <span className={styles.infoValueSub}>{EVENT_CONFIG.timeDisplay}</span>
            </div>
          </div>

          <div className={styles.infoRow}>
            <div>
              <span className={styles.infoLabel}>Địa điểm</span>
              <span className={`${styles.infoValue} ${styles.infoValueRed}`}>{EVENT_CONFIG.venue}</span>
              <span className={styles.infoValueSub}>{EVENT_CONFIG.address}</span>
            </div>
          </div>
        </div>

        {/* Travel section */}
        <div className={`anim-fadeup`} style={{ animationDelay: "0.1s" }}>
          <div className={styles.sectionTitle}>► DI CHUYỂN</div>
          <div className={styles.travelBtnGrid}>
            <a href={EVENT_CONFIG.googleMapsUrl} target="_blank" rel="noopener noreferrer"
              className={`px-btn px-btn-red ${styles.travelBtn}`}>
              Google Maps
            </a>
            <a href={EVENT_CONFIG.directionVideoUrl} target="_blank" rel="noopener noreferrer"
              className={`px-btn px-btn-gold ${styles.travelBtn}`}>
              Video Hướng Dẫn
            </a>
          </div>
        </div>

        {/* Map images */}
        <div className={`anim-fadeup`} style={{ animationDelay: "0.2s" }}>
          <div className={styles.sectionTitle}>► SƠ ĐỒ</div>
          <div className={styles.mapGrid}>
            <a href={EVENT_CONFIG.mapImageUrl} target="_blank" className={styles.mapCard}>
              <Image src={EVENT_CONFIG.mapImageUrl} alt="Sơ đồ trường" width={300} height={160}
                style={{ width: "100%", height: 140, objectFit: "cover" }} />
              <span className={styles.mapCardLabel}>Sơ đồ trường</span>
            </a>
            <a href={EVENT_CONFIG.parkingImageUrl} target="_blank" className={styles.mapCard}>
              <Image src={EVENT_CONFIG.parkingImageUrl} alt="Hướng dẫn đậu xe" width={300} height={160}
                style={{ width: "100%", height: 140, objectFit: "cover" }} />
              <span className={styles.mapCardLabel}>Hướng dẫn đậu xe</span>
            </a>
          </div>
        </div>

        {/* Contact */}
        <div className={`px-box anim-fadeup`} style={{ animationDelay: "0.3s" }}>
          <div className={styles.infoCardTitle}>► LIÊN HỆ</div>
          {EVENT_CONFIG.contacts.map((c, i) => (
            <div key={i} className={styles.contactRow}>
              <span className={styles.contactName}>{c.name}</span>
              <a href={`tel:${c.phone.replace(/\s/g, "")}`} className={styles.contactPhone}>
                {c.phone}
              </a>
            </div>
          ))}
        </div>

        {/* Back to invite */}
        <div style={{ textAlign: "center", paddingBottom: 32 }}>
          <button
            className={`px-btn px-btn-outline ${styles.backToInvBtn}`}
            onClick={() => setStep("invitation")}
          >
            ← Xem lại thư mời
          </button>
        </div>

      </div>
    </div>
  );
}
