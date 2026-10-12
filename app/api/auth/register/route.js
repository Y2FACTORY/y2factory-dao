import { NextResponse } from 'next/server';

// メールアドレスでの新規登録は終了（Discord ログインで自動登録される）
export async function POST() {
    return NextResponse.json(
        { error: 'メールアドレスでの新規登録は終了しました。Discordでログインすると自動で登録されます。' },
        { status: 410 }
    );
}
