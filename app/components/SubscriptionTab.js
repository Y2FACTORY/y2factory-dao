"use client";
import React, { useState, useEffect } from "react";
import { PayPalScriptProvider } from "@paypal/react-paypal-js";
import PayPalPlanButton from "./PayPalPlanButton";

export default function SubscriptionTab({ user, fetchData }) {
    const [clientId, setClientId] = useState("");
    const [activeSub, setActiveSub] = useState(null);
    const [loading, setLoading] = useState(true);
    const [cancelling, setCancelling] = useState(false);

    useEffect(() => {
        // Fetch Client ID & Subscription Status at once
        Promise.all([
            fetch("/api/paypal/config").then(r => r.json()),
            fetch("/api/user/subscription").then(r => r.json())
        ]).then(([configData, subData]) => {
            setClientId(configData.clientId);
            if (subData.success && subData.subscription) {
                setActiveSub(subData.subscription);
            }
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    const handleCancel = async () => {
        if (!confirm("本当に解約しますか？即座に月額決済が停止し、現在の役職がリセットされます。")) return;
        
        setCancelling(true);
        try {
            const res = await fetch("/api/paypal/cancel", { method: "POST" });
            const data = await res.json();
            
            if (data.success) {
                alert("解約手続きが完了しました。");
                setActiveSub(null);
                fetchData(); // ユーザー情報を再取得する (ロール更新等を反映)
            } else {
                alert(`エラー: ${data.error}`);
            }
        } catch (e) {
            alert("通信エラーが発生しました。");
        }
        setCancelling(false);
    };

    if (loading || !clientId) {
        return <div className="card" style={{ padding: "2rem", textAlign: "center" }}>読み込み中...</div>;
    }

    const plans = [
        { title: "主任プラン", price: "980円/月", points: "10,000pt", planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_1 || "", color: "#00C9FF" },
        { title: "部長プラン", price: "1,980円/月", points: "20,000pt", planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_2 || "", color: "#F9A826" },
        { title: "役員プラン", price: "2,980円/月", points: "30,000pt", planId: process.env.NEXT_PUBLIC_PAYPAL_PLAN_3 || "", color: "#E040FB" }
    ];

    // Get active plan info if subscribed
    const currentPlanInfo = activeSub ? plans.find(p => p.planId === activeSub.plan_id) : null;

    return (
        <PayPalScriptProvider options={{ clientId: clientId, vault: true, intent: "subscription" }}>
            <div className="animate-fade-in card" style={{ padding: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", flexWrap: "wrap", gap: "1rem", marginBottom: "1rem" }}>
                     <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", margin: 0 }}>⭐ プラン・サブスクリプション設定</h3>
                     <a 
                       href="https://kiyac.app/SCTLaw/sNrv7IZCoToLaE6GBwAl" 
                       target="_blank" 
                       rel="noopener noreferrer"
                       style={{ fontSize: "0.75rem", color: "var(--accent-primary)", textDecoration: "underline" }}
                     >
                        特定商取引法に基づく表記
                     </a>
                </div>

                {activeSub ? (
                     // ======== 契約中のユーザー向けUI ========
                     <div style={{ padding: "2rem", background: "rgba(67, 233, 123, 0.05)", border: "1px solid rgba(67, 233, 123, 0.3)", borderRadius: "var(--radius-lg)", textAlign: "center" }}>
                         <div style={{ fontSize: "2rem", marginBottom: "0.5rem" }}>🎉</div>
                         <h4 style={{ fontWeight: "bold", color: "var(--success)", fontSize: "1.1rem", marginBottom: "0.5rem" }}>
                            現在 {currentPlanInfo ? currentPlanInfo.title : "定期プラン"} をご契約中です
                         </h4>
                         <p style={{ color: "var(--text-secondary)", fontSize: "0.85rem", marginBottom: "2rem" }}>
                            毎月の決済完了時に自動的に役職報酬ポイントが付与されます。
                         </p>
                         
                         <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "1.5rem" }}>
                             <button 
                                onClick={handleCancel} 
                                disabled={cancelling}
                                className="btn btn-danger btn-sm"
                                style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                             >
                                 {cancelling ? "処理中..." : "サブスクリプションを解約する"}
                             </button>
                             <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
                                解約を行うと即座に役職がリセットされます。
                             </p>
                         </div>
                     </div>
                ) : (
                     // ======== 未契約ユーザー向けUI ========
                     <>
                        <p style={{ marginBottom: "1.5rem", fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                            ご自身の用途に合ったプランをお選びください。<br/>
                            PayPalで定期決済に登録すると、毎月の決済完了時にポイントが自動で付与され、役職が変更されます。
                        </p>

                        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "1.5rem" }}>
                            {plans.map((p, i) => (
                                <div key={i} style={{ padding: "1.5rem", border: `2px solid ${p.color}`, borderRadius: "var(--radius-lg)", background: "var(--bg-secondary)", display: "flex", flexDirection: "column" }}>
                                    <h4 style={{ color: p.color, fontSize: "1.1rem", marginBottom: "0.5rem", fontWeight: "bold" }}>{p.title}</h4>
                                    <div style={{ fontSize: "1.4rem", fontWeight: 800, marginBottom: "0.5rem" }}>{p.price}</div>
                                    <div style={{ color: "var(--success)", fontWeight: 700, marginBottom: "1.5rem", fontSize: "0.95rem" }}>✨ 毎月 {p.points} 付与</div>
                                    <div style={{ marginTop: "auto" }}>
                                        <PayPalPlanButton planId={p.planId} customId={user.id} />
                                    </div>
                                </div>
                            ))}
                        </div>
                     </>
                )}
            </div>
        </PayPalScriptProvider>
    );
}
