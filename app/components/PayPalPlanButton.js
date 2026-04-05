"use client";
import { PayPalButtons } from "@paypal/react-paypal-js";

export default function PayPalPlanButton({ planId, customId }) {
    if (!planId) {
        return (
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)", padding: "0.5rem", textAlign: "center", border: "1px dashed var(--border)" }}>
                （プランID未設定）
            </div>
        );
    }

    return (
        <PayPalButtons
            createSubscription={(data, actions) => {
                return actions.subscription.create({
                    plan_id: planId,
                    custom_id: customId // To identify the user on Webhook
                });
            }}
            onApprove={(data, actions) => {
                alert("サブスクリプションが承認されました！(処理中...)");
            }}
            onError={(err) => {
                console.error("PayPal Error:", err);
                alert("決済エラーが発生しました。");
            }}
            style={{
                layout: "horizontal",
                color: "gold",
                shape: "pill",
                label: "subscribe"
            }}
        />
    );
}
