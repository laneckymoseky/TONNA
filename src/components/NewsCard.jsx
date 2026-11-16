import Social from './Social'

const AUD = { team: 'Team only', captains: 'Captains only' }

export default function NewsCard({ post, canDelete, onDelete }) {
  return (
    <div className="card">
      {post.image_url && <img className="news-img" src={post.image_url} alt="" />}
      <div className="row">
        <h2 style={{ fontSize: 20 }}>{post.title}</h2>
        {AUD[post.audience] && <span className="tag">{AUD[post.audience]}</span>}
      </div>
      <p className="muted" style={{ margin: '4px 0 10px' }}>
        {post.author_name}{post.tn_teams?.name && ` · ${post.tn_teams.name}`} · {new Date(post.created_at).toLocaleString()}
      </p>
      <p style={{ whiteSpace: 'pre-wrap' }}>{post.body}</p>
      <Social type="news" id={post.id} moderate={canDelete} />
      {canDelete && <button className="ghost" style={{ marginTop: 10 }} onClick={() => onDelete(post.id)}>DELETE POST</button>}
    </div>
  )
}