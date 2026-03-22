import './globals.css';

export const metadata = {
    title: 'Y2FACTORY DAO - SNS型ガバナンス・プラットフォーム',
    description: '活動を通じてポイントを獲得し、コミュニティの意思決定に参加しよう。',
};

export default function RootLayout({ children }) {
    return (
        <html lang="ja">
            <body>{children}</body>
        </html>
    );
}
