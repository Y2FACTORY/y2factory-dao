import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { v4 as uuidv4 } from 'uuid';

export async function POST() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
        const userId = user.id;

        const db = getDb();
        const activeSub = db.prepare('SELECT * FROM subscriptions WHERE user_id = ? AND status = ?').get(userId, 'ACTIVE');

        if (!activeSub) {
            return NextResponse.json({ success: false, error: '有効なサブスクリプションが見つかりません。' }, { status: 400 });
        }

        const clientId = process.env.PAYPAL_CLIENT_ID;
        const secretKey = process.env.PAYPAL_SECRET_KEY;
        const subscriptionId = activeSub.paypal_subscription_id;

        if (!secretKey) {
            return NextResponse.json({ success: false, error: 'PayPalシークレットキーが設定されていません。運営にお問い合わせください。' }, { status: 500 });
        }

        // 1. Get Access Token from PayPal
        const authUrl = process.env.NODE_ENV === 'production' ? 'https://api-m.paypal.com/v1/oauth2/token' : 'https://api-m.sandbox.paypal.com/v1/oauth2/token';
        const cancelUrl = process.env.NODE_ENV === 'production' 
            ? `https://api-m.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`
            : `https://api-m.sandbox.paypal.com/v1/billing/subscriptions/${subscriptionId}/cancel`;

        const authFallback = Buffer.from(`${clientId}:${secretKey}`).toString('base64');
        
        const tokenRes = await fetch(authUrl, {
            method: 'POST',
            body: 'grant_type=client_credentials',
            headers: {
                'Authorization': `Basic ${authFallback}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        
        const tokenData = await tokenRes.json();
        
        if (!tokenData.access_token) {
            throw new Error('PayPalからアクセストークンを取得できませんでした。');
        }

        // 2. Cancel Subscription on PayPal via REST API
        const cancelRes = await fetch(cancelUrl, {
            method: 'POST',
            body: JSON.stringify({ reason: "ユーザーによるマイページからの解約操作" }),
            headers: {
                'Authorization': `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json'
            }
        });

        // 204 No Content is success for PayPal Cancel API
        if (!cancelRes.ok && cancelRes.status !== 204) {
             const errData = await cancelRes.json();
             console.error("PayPal Cancel Error:", errData);
             throw new Error('PayPal側の決済停止処理に失敗しました。');
        }

        // 3. Update DB (Cancel sub, Reset Role to Member)
        const now = new Date().toISOString();
        db.prepare('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?').run('CANCELLED', now, activeSub.id);
        db.prepare('UPDATE users SET display_role = ? WHERE id = ?').run('Y2FDメンバー', userId);
        
        // Notify user
        db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
            .run(uuidv4(), userId, 'system', '定期決済の解約完了', 'プランの解約が完了し、役職がリセットされました。ご利用ありがとうございました！', '/mypage');

        return NextResponse.json({ success: true });
    } catch (e) {
        console.error("Cancel Subs API error:", e);
        return NextResponse.json({ success: false, error: e.message || '解約処理に失敗しました' }, { status: 500 });
    }
}
