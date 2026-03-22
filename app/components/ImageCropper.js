'use client';
import { useState, useRef, useEffect, useCallback } from 'react';

export default function ImageCropper({ imageSrc, onCrop, onCancel }) {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);
    const [img, setImg] = useState(null);
    const [scale, setScale] = useState(1);
    const [offset, setOffset] = useState({ x: 0, y: 0 });
    const [dragging, setDragging] = useState(false);
    const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
    const [cropSize, setCropSize] = useState(240);

    // Clamp offset so image always covers the crop circle
    const clampOffset = useCallback((ox, oy, s, image) => {
        const i = image || img;
        if (!i) return { x: ox, y: oy };
        const iw = i.width * s;
        const ih = i.height * s;
        const pad = 8; // crop circle inset from canvas edge
        const circleLeft = pad;
        const circleRight = cropSize - pad;
        const circleTop = pad;
        const circleBottom = cropSize - pad;
        // Constrain: image left edge <= circleLeft, image right edge >= circleRight
        let cx = ox;
        let cy = oy;
        if (cx > circleLeft) cx = circleLeft;           // don't drag too far right
        if (cx + iw < circleRight) cx = circleRight - iw; // don't drag too far left
        if (cy > circleTop) cy = circleTop;              // don't drag too far down
        if (cy + ih < circleBottom) cy = circleBottom - ih; // don't drag too far up
        return { x: cx, y: cy };
    }, [img, cropSize]);

    // Load image
    useEffect(() => {
        const image = new Image();
        image.onload = () => {
            setImg(image);
            // Fit image so shortest side fills the crop circle
            const containerSize = Math.min(window.innerWidth - 64, 400);
            setCropSize(containerSize);
            const minDim = Math.min(image.width, image.height);
            const initScale = containerSize / minDim;
            setScale(initScale);
            setOffset({
                x: (containerSize - image.width * initScale) / 2,
                y: (containerSize - image.height * initScale) / 2,
            });
        };
        image.src = imageSrc;
    }, [imageSrc]);

    const draw = useCallback(() => {
        const canvas = canvasRef.current;
        if (!canvas || !img) return;
        const ctx = canvas.getContext('2d');
        canvas.width = cropSize;
        canvas.height = cropSize;

        // Clear
        ctx.clearRect(0, 0, cropSize, cropSize);

        // Draw image
        ctx.save();
        ctx.drawImage(img, offset.x, offset.y, img.width * scale, img.height * scale);
        ctx.restore();

        // Dark overlay outside circle
        ctx.save();
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, cropSize, cropSize);
        // Cut out circle
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2 - 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Circle border
        ctx.strokeStyle = 'rgba(108, 99, 255, 0.7)';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(cropSize / 2, cropSize / 2, cropSize / 2 - 8, 0, Math.PI * 2);
        ctx.stroke();
    }, [img, offset, scale, cropSize]);

    useEffect(() => { draw(); }, [draw]);

    // Get pointer position from either mouse or touch event
    const getPos = (e) => {
        if (e.touches && e.touches.length > 0) {
            return { x: e.touches[0].clientX, y: e.touches[0].clientY };
        }
        return { x: e.clientX, y: e.clientY };
    };

    const handlePointerDown = (e) => {
        e.preventDefault();
        const pos = getPos(e);
        setDragging(true);
        setDragStart({ x: pos.x - offset.x, y: pos.y - offset.y });
    };

    const handlePointerMove = (e) => {
        if (!dragging) return;
        e.preventDefault();
        const pos = getPos(e);
        const raw = { x: pos.x - dragStart.x, y: pos.y - dragStart.y };
        setOffset(clampOffset(raw.x, raw.y, scale));
    };

    const handlePointerUp = () => setDragging(false);

    const handleWheel = (e) => {
        e.preventDefault();
        const delta = e.deltaY > 0 ? -0.05 : 0.05;
        const minScale = img ? (cropSize - 16) / Math.min(img.width, img.height) : 0.1;
        const newScale = Math.max(minScale, Math.min(5, scale + delta));
        const cx = cropSize / 2;
        const cy = cropSize / 2;
        const ratio = newScale / scale;
        const newOx = cx - (cx - offset.x) * ratio;
        const newOy = cy - (cy - offset.y) * ratio;
        const clamped = clampOffset(newOx, newOy, newScale);
        setOffset(clamped);
        setScale(newScale);
    };

    // Pinch zoom for mobile
    const lastTouchDist = useRef(null);
    const handleTouchMove = (e) => {
        if (e.touches.length === 2) {
            e.preventDefault();
            const dx = e.touches[0].clientX - e.touches[1].clientX;
            const dy = e.touches[0].clientY - e.touches[1].clientY;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (lastTouchDist.current !== null) {
                const delta = (dist - lastTouchDist.current) * 0.005;
                const minScale = img ? (cropSize - 16) / Math.min(img.width, img.height) : 0.1;
                const newScale = Math.max(minScale, Math.min(5, scale + delta));
                const cx = cropSize / 2;
                const cy = cropSize / 2;
                const ratio = newScale / scale;
                const newOx = cx - (cx - offset.x) * ratio;
                const newOy = cy - (cy - offset.y) * ratio;
                setOffset(clampOffset(newOx, newOy, newScale));
                setScale(newScale);
            }
            lastTouchDist.current = dist;
        } else if (e.touches.length === 1 && dragging) {
            handlePointerMove(e);
        }
    };

    const handleTouchEnd = () => {
        setDragging(false);
        lastTouchDist.current = null;
    };

    const handleCrop = () => {
        if (!img) return;
        const outputCanvas = document.createElement('canvas');
        const outputSize = 256; // Final avatar size
        outputCanvas.width = outputSize;
        outputCanvas.height = outputSize;
        const ctx = outputCanvas.getContext('2d');

        // Clip to circle
        ctx.beginPath();
        ctx.arc(outputSize / 2, outputSize / 2, outputSize / 2, 0, Math.PI * 2);
        ctx.clip();

        // Scale factor from display to output
        const ratio = outputSize / (cropSize - 16); // account for 8px padding each side
        const imgX = (offset.x - 8) * ratio;
        const imgY = (offset.y - 8) * ratio;
        const imgW = img.width * scale * ratio;
        const imgH = img.height * scale * ratio;

        ctx.drawImage(img, imgX, imgY, imgW, imgH);

        outputCanvas.toBlob((blob) => {
            if (blob) onCrop(blob);
        }, 'image/png', 1);
    };

    return (
        <div style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            zIndex: 1000, background: 'rgba(0,0,0,0.85)',
            display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
            padding: '1rem',
        }}>
            <div style={{
                background: 'var(--bg-card)', borderRadius: 'var(--radius-lg)',
                padding: '1.5rem', maxWidth: '440px', width: '100%',
                border: '1px solid var(--border)',
            }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1rem', textAlign: 'center' }}>
                    ✂️ アイコンを切り抜き
                </h3>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginBottom: '1rem' }}>
                    ドラッグで移動 · スクロール/ピンチで拡大縮小
                </p>

                <div
                    ref={containerRef}
                    style={{
                        width: cropSize, height: cropSize, margin: '0 auto',
                        cursor: dragging ? 'grabbing' : 'grab',
                        touchAction: 'none', borderRadius: 'var(--radius-md)',
                        overflow: 'hidden', background: '#000',
                    }}
                >
                    <canvas
                        ref={canvasRef}
                        width={cropSize}
                        height={cropSize}
                        style={{ display: 'block', width: '100%', height: '100%' }}
                        onMouseDown={handlePointerDown}
                        onMouseMove={handlePointerMove}
                        onMouseUp={handlePointerUp}
                        onMouseLeave={handlePointerUp}
                        onWheel={handleWheel}
                        onTouchStart={handlePointerDown}
                        onTouchMove={handleTouchMove}
                        onTouchEnd={handleTouchEnd}
                    />
                </div>

                {/* Zoom slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1rem auto 0', maxWidth: cropSize }}>
                    <span style={{ fontSize: '0.8rem' }}>🔍</span>
                    <input
                        type="range"
                        min={img ? (cropSize - 16) / Math.min(img.width, img.height) : 0.1} max="5" step="0.01"
                        value={scale}
                        onChange={(e) => {
                            const newScale = parseFloat(e.target.value);
                            const cx = cropSize / 2;
                            const cy = cropSize / 2;
                            const ratio = newScale / scale;
                            const newOx = cx - (cx - offset.x) * ratio;
                            const newOy = cy - (cy - offset.y) * ratio;
                            setOffset(clampOffset(newOx, newOy, newScale));
                            setScale(newScale);
                        }}
                        style={{
                            flex: 1, accentColor: 'var(--accent-primary)',
                            height: '4px', cursor: 'pointer',
                        }}
                    />
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', minWidth: '2.5rem', textAlign: 'right' }}>
                        {Math.round(scale * 100)}%
                    </span>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center', marginTop: '1.25rem' }}>
                    <button className="btn btn-ghost" onClick={onCancel}>キャンセル</button>
                    <button className="btn btn-primary" onClick={handleCrop}>✅ 切り抜いて適用</button>
                </div>
            </div>
        </div>
    );
}
