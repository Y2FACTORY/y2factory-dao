'use client';
import { useParams } from 'next/navigation';
import SuggestionsView from '../SuggestionsView';

// 募集の個別ページ。告知でこのURLを貼れば、ログイン後すぐ提出できる
export default function SuggestionDetailPage() {
    const { id } = useParams();
    return <SuggestionsView focusId={id} />;
}
