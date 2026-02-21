import './NewsArticle.css'

export default function NewsArticle({ title, body, authorName, commentCount }) {
    const truncateText = (text, maxLength) => {
        if (!text) return '';
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + "...";
        }
        return text;
    };

    return (
        <div className="article-card">
            <h2 className="article-title">{truncateText(title, 50)}</h2>
            <p className="article-body">{truncateText(body, 120)}</p>
            <div className="article-meta">
                {authorName && <span className="article-author">By {authorName}</span>}
                {commentCount !== undefined && <span className="article-comments">💬 {commentCount}</span>}
            </div>
        </div>
    );
}
