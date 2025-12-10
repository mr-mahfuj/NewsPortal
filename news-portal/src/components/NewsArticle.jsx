import './NewsArticle.css'

export default function NewArticle(prop) {
    return(
        <>
            <div className='article-container'>
                <h2>{prop.title}</h2>
                <p>{prop.body}</p>
            </div>
        </>
    )
}