import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

// Verify the webhook using the PayPal SDK or manually (skip strict verification for simplicity here, but recommend checking in prod)
// We need to parse incoming webhook events from PayPal.

export async function POST(req) {
    try {
        const body = await req.json();
        const event_type = body.event_type;
        const resource = body.resource;
        
        console.log(`[PayPal Webhook] Received Event: ${event_type}`, resource.id);
        
        const db = getDb();
        const now = new Date().toISOString();

        // Helpers for roles and points
        const PLAN_MAP = {
            [process.env.NEXT_PUBLIC_PAYPAL_PLAN_1]: { role: '主任', points: 10000, name: '980円' },
            [process.env.NEXT_PUBLIC_PAYPAL_PLAN_2]: { role: '部長', points: 20000, name: '1980円' },
            [process.env.NEXT_PUBLIC_PAYPAL_PLAN_3]: { role: '役員', points: 30000, name: '2980円' },
        };

        if (event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
            // New subscription started
            const planId = resource.plan_id;
            const subId = resource.id;
            const userId = resource.custom_id; // Passed when creating subscription
            
            if (userId) {
                // Upsert subscription record
                const existing = db.prepare('SELECT id FROM subscriptions WHERE paypal_subscription_id = ?').get(subId);
                if (existing) {
                    db.prepare('UPDATE subscriptions SET status = ?, plan_id = ?, failure_count = 0, updated_at = ? WHERE paypal_subscription_id = ?')
                      .run('ACTIVE', planId, now, subId);
                } else {
                    db.prepare('INSERT INTO subscriptions (id, user_id, paypal_subscription_id, plan_id, status) VALUES (?, ?, ?, ?, ?)')
                      .run(uuidv4(), userId, subId, planId, 'ACTIVE');
                }
            }
        } 
        else if (event_type === 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED' || event_type === 'PAYMENT.SALE.COMPLETED') {
            // A payment went through! Add points and update role.
            const subId = resource.billing_agreement_id || resource.id; 
            const subRecord = db.prepare('SELECT * FROM subscriptions WHERE paypal_subscription_id = ?').get(subId);
            
            if (subRecord) {
                const userId = subRecord.user_id;
                const planId = subRecord.plan_id;
                const planDetails = PLAN_MAP[planId];
                
                // Reset failure count on success
                db.prepare('UPDATE subscriptions SET status = ?, failure_count = 0, updated_at = ? WHERE id = ?').run('ACTIVE', now, subRecord.id);

                if (planDetails) {
                    // Update Role
                    db.prepare('UPDATE users SET display_role = ? WHERE id = ?')
                      .run(planDetails.role, userId);
                      
                    // Add Points
                    db.prepare('INSERT INTO points (id, user_id, db_name, amount, reason, granted_by) VALUES (?, ?, ?, ?, ?, ?)')
                      .run(uuidv4(), userId, 'default', planDetails.points, `PayPalサブスク(${planDetails.name}) 自動付与`, null);
                      
                    // Notify User
                    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
                      .run(uuidv4(), userId, 'system', '決済が完了しました', `PayPalの購読確認と ${planDetails.points}P の付与が行われました。役職が【${planDetails.role}】になりました！`, '/mypage?tab=subscription');
                }
            }
        } 
        else if (event_type === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') {
            // Payment failed. Increment the counter.
            const subId = resource.billing_agreement_id || resource.id;
            const subRecord = db.prepare('SELECT * FROM subscriptions WHERE paypal_subscription_id = ?').get(subId);
            
            if (subRecord) {
                const newCount = subRecord.failure_count + 1;
                db.prepare('UPDATE subscriptions SET failure_count = ?, updated_at = ? WHERE id = ?')
                  .run(newCount, now, subRecord.id);
                  
                if (newCount >= 3) {
                    db.prepare('UPDATE users SET display_role = ? WHERE id = ?').run('Y2FDメンバー', subRecord.user_id);
                    db.prepare('UPDATE subscriptions SET status = ? WHERE id = ?').run('SUSPENDED', subRecord.id);
                    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
                      .run(uuidv4(), subRecord.user_id, 'system', '自動引き落としエラー(3回)', `サブスクリプションの決済が3回失敗したため、役職をリセットしました。`, '/mypage?tab=subscription');
                } else {
                    db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
                      .run(uuidv4(), subRecord.user_id, 'system', '決済エラーのお知らせ', `月額決済に失敗しました（${newCount}回目）。PayPalにて再決済が行われます。`, '/mypage?tab=subscription');
                }
            }
        }
        else if (event_type === 'BILLING.SUBSCRIPTION.CANCELLED' || event_type === 'BILLING.SUBSCRIPTION.SUSPENDED') {
            // User manually cancelled, or suspended
            const subId = resource.id;
            const subRecord = db.prepare('SELECT * FROM subscriptions WHERE paypal_subscription_id = ?').get(subId);
            
            if (subRecord) {
                db.prepare('UPDATE users SET display_role = ? WHERE id = ?').run('Y2FDメンバー', subRecord.user_id);
                db.prepare('UPDATE subscriptions SET status = ?, updated_at = ? WHERE id = ?').run(event_type === 'BILLING.SUBSCRIPTION.CANCELLED' ? 'CANCELLED' : 'SUSPENDED', now, subRecord.id);
                db.prepare('INSERT INTO notifications (id, user_id, type, title, message, link) VALUES (?, ?, ?, ?, ?, ?)')
                  .run(uuidv4(), subRecord.user_id, 'system', 'サブスクリプション解約', `定期購読が解約・停止されたため、役職を【Y2FDメンバー】にリセットしました。`, '/mypage?tab=subscription');
            }
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Webhook processing error:", error);
        return NextResponse.json({ success: false, error: 'Internal Server Error' }, { status: 500 });
    }
}
