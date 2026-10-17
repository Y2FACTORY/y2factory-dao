// ログイン失敗の回数制限（総当たり対策）。プロセス内のメモリで数える（pm2 は1プロセス運用）
const WINDOW_MS = 15 * 60 * 1000; // 15分
const MAX_FAILURES = 5;

const failures = new Map(); // key -> { count, first }

// nginx が X-Real-IP を付けている（X-Forwarded-For は付けていないので、利用者が偽装できる。使わない）
function getClientIp(request) {
    return request.headers.get('x-real-ip') || 'unknown';
}

function prune(now) {
    for (const [key, v] of failures) {
        if (now - v.first > WINDOW_MS) failures.delete(key);
    }
}

// 制限中なら残り秒数、そうでなければ 0
function blockedSeconds(keys) {
    const now = Date.now();
    prune(now);
    let wait = 0;
    for (const key of keys) {
        const v = failures.get(key);
        if (v && v.count >= MAX_FAILURES) {
            wait = Math.max(wait, Math.ceil((v.first + WINDOW_MS - now) / 1000));
        }
    }
    return wait;
}

function recordFailure(keys) {
    const now = Date.now();
    for (const key of keys) {
        const v = failures.get(key);
        if (!v || now - v.first > WINDOW_MS) failures.set(key, { count: 1, first: now });
        else v.count += 1;
    }
}

function clearFailures(keys) {
    for (const key of keys) failures.delete(key);
}

module.exports = { getClientIp, blockedSeconds, recordFailure, clearFailures };
