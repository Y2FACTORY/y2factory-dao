'use client';
import Link from 'next/link';
import { useEffect, useRef } from 'react';

export default function Home() {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let animationId;
        let particles = [];

        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        resize();
        window.addEventListener('resize', resize);

        class Particle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * canvas.width;
                this.y = Math.random() * canvas.height;
                this.size = Math.random() * 2 + 0.5;
                this.speedX = (Math.random() - 0.5) * 0.4;
                this.speedY = (Math.random() - 0.5) * 0.4;
                this.opacity = Math.random() * 0.5 + 0.1;
                this.hue = Math.random() > 0.5 ? 250 : 280;
            }
            update() {
                this.x += this.speedX;
                this.y += this.speedY;
                if (this.x < 0 || this.x > canvas.width) this.speedX *= -1;
                if (this.y < 0 || this.y > canvas.height) this.speedY *= -1;
            }
            draw() {
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fillStyle = `hsla(${this.hue}, 80%, 70%, ${this.opacity})`;
                ctx.fill();
            }
        }

        const count = Math.min(80, Math.floor(window.innerWidth / 15));
        for (let i = 0; i < count; i++) {
            particles.push(new Particle());
        }

        const drawLines = () => {
            for (let i = 0; i < particles.length; i++) {
                for (let j = i + 1; j < particles.length; j++) {
                    const dx = particles[i].x - particles[j].x;
                    const dy = particles[i].y - particles[j].y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist < 120) {
                        ctx.beginPath();
                        ctx.moveTo(particles[i].x, particles[i].y);
                        ctx.lineTo(particles[j].x, particles[j].y);
                        ctx.strokeStyle = `rgba(108, 99, 255, ${0.08 * (1 - dist / 120)})`;
                        ctx.lineWidth = 0.5;
                        ctx.stroke();
                    }
                }
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            particles.forEach(p => {
                p.update();
                p.draw();
            });
            drawLines();
            animationId = requestAnimationFrame(animate);
        };
        animate();

        return () => {
            cancelAnimationFrame(animationId);
            window.removeEventListener('resize', resize);
        };
    }, []);

    return (
        <main className="landing-page">
            <canvas ref={canvasRef} className="landing-canvas" />

            {/* Floating orbs */}
            <div className="landing-orb landing-orb-1" />
            <div className="landing-orb landing-orb-2" />
            <div className="landing-orb landing-orb-3" />

            <section className="landing-hero">
                <div className="landing-badge animate-fade-in">
                    <img src="/logo.png" alt="" style={{ width: '20px', height: '20px', borderRadius: '4px' }} />
                    <span>Y2FACTORY DAO</span>
                </div>

                <h1 className="landing-title animate-slide-up">
                    <span className="landing-title-line">みんなが</span>
                    <span className="landing-title-accent">ワイワイ</span>
                    <span className="landing-title-line">楽しめる</span>
                    <span className="landing-title-line">世界を</span>
                </h1>

                <p className="landing-desc animate-slide-up" style={{ animationDelay: '0.15s' }}>
                    「みんながワイワイ楽しめる世界を」をミッションに、
                    <br className="landing-br-hide" />
                    参加者が主体的に関与し共創を通じて価値を創出し、
                    <br className="landing-br-hide" />
                    楽しい世界の実現と拡張を担うクリエイティブな共創コミュニティです。
                </p>

                <div className="landing-buttons animate-slide-up" style={{ animationDelay: '0.3s' }}>
                    <Link href="/login" className="landing-cta-btn">
                        <span>ログイン</span>
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M5 12h14M12 5l7 7-7 7"/>
                        </svg>
                    </Link>
                </div>

                <div className="landing-glow-line animate-fade-in" style={{ animationDelay: '0.5s' }} />
            </section>
        </main>
    );
}
