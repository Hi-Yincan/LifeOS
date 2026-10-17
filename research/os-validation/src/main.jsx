import React, { createContext, useContext, useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { App, ProzillaOS, Desktop, WindowsView, ModalsView, Taskbar, Vector2, useWindowsManager } from '@prozilla-os/core';
import './style.css';

let csrf;
async function api(path, options = {}) {
  const response = await fetch(path, { credentials: 'same-origin', ...options, headers: { 'Content-Type': 'application/json', ...(csrf ? { 'X-CSRF-Token': csrf } : {}), ...options.headers } });
  const body = await response.json();
  if (!response.ok) throw new Error(body.error ?? `HTTP ${response.status}`);
  return body;
}
const Context = createContext(null);
const useApp = () => useContext(Context);

function useCloseRoute() {
  const windows = useWindowsManager();
  const { navigate } = useApp();
  useEffect(() => () => {
    queueMicrotask(() => { if (windows && !windows.windowIds.length) navigate('/', true); });
  }, [windows]);
}

function Provider({ children }) {
  const [session, setSession] = useState({ role: 'visitor', authenticated: false });
  const [path, setPath] = useState(location.pathname);
  const [navigationRevision, setNavigationRevision] = useState(0);
  const [revision, setRevision] = useState(0);
  const applySession = value => { csrf = value.csrf; setSession(value); setRevision(value => value + 1); };
  useEffect(() => { api('/api/session').then(applySession); const handle = () => setPath(location.pathname); addEventListener('popstate', handle); return () => removeEventListener('popstate', handle); }, []);
  const navigate = (value, replace = false) => { if (location.pathname !== value) history[replace ? 'replaceState' : 'pushState']({}, '', value); setPath(value); setNavigationRevision(value => value + 1); };
  return <Context.Provider value={{ session, applySession, path, navigate, navigationRevision, revision, refresh: () => setRevision(value => value + 1) }}>{children}</Context.Provider>;
}

function SessionBar({ close }) {
  const { session, applySession, navigate } = useApp();
  const [showLogin, setShowLogin] = useState(false);
  const [error, setError] = useState('');
  return <div className="session-area">
    <div className="session-row">
      {close && <button onClick={() => { close(); navigate('/'); }}>← 返回桌面</button>}
      <span className="role-badge">{session.role === 'admin' ? 'admin · 内容管理' : 'visitor · 公开浏览'}</span>
      {session.authenticated
        ? <button onClick={async () => { await api('/api/logout', { method: 'POST', body: '{}' }); applySession({ role: 'visitor', authenticated: false, csrf: null }); }}>退出登录</button>
        : <button onClick={() => setShowLogin(value => !value)}>管理员登录</button>}
    </div>
    {showLogin && !session.authenticated && <form className="login-form" onSubmit={async event => {
      event.preventDefault(); setError('');
      try { const password = new FormData(event.currentTarget).get('password'); applySession(await api('/api/login', { method: 'POST', body: JSON.stringify({ username: 'admin', password }) })); setShowLogin(false); }
      catch (error) { setError(error.message); }
    }}><label>实验登录口令<input name="password" type="password" required autoComplete="current-password" /></label><button type="submit">登录管理视图</button><p>本地实验身份，不使用真实账号凭证。</p></form>}
    {error && <p role="alert">{error}</p>}
  </div>;
}

function Blog({ close, active }) {
  useCloseRoute();
  const { navigate } = useApp();
  const [article, setArticle] = useState(null);
  useEffect(() => { api('/api/blog').then(setArticle); }, []);
  useEffect(() => { if (active) navigate('/blog/validation-note'); }, [active]);
  return <section className="content-panel" aria-label="博客内容">
    <SessionBar close={close}/>
    {article ? <article><p className="eyebrow">合成内容 · 阅读验证</p><h1>{article.title}</h1><p className="lede">{article.summary}</p><a href="/blog/validation-note" onClick={event => { event.preventDefault(); navigate('/blog/validation-note'); }}>文章永久链接</a>{article.paragraphs.map((text, i) => <p key={i}>{text}</p>)}</article> : <p>正在加载文章…</p>}
  </section>;
}

function Wardrobe({ close, active }) {
  useCloseRoute();
  const { session, path, navigate, revision, refresh } = useApp();
  const [items, setItems] = useState([]);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const admin = session.role === 'admin';
  const detailId = path.startsWith('/wardrobe/') ? path.split('/')[2] : null;
  const selected = detailId ? items.find(item => item.id === detailId) ?? null : null;
  useEffect(() => { if (active && !location.pathname.startsWith('/wardrobe')) navigate('/wardrobe'); }, [active]);
  useEffect(() => {
    let valid = true;
    api(admin ? '/api/admin/wardrobe' : '/api/wardrobe').then(values => { if (valid) { setItems(values); setError(''); } }).catch(error => { if (valid) setError(error.message); });
    return () => { valid = false; };
  }, [admin, revision]);
  const act = async (operation, message) => { setError(''); try { await operation(); setNotice(message); refresh(); } catch (error) { setError(error.message); } };
  return <section className="content-panel" aria-label="衣柜内容">
    <SessionBar close={close}/>
    <div className="heading-row"><div><p className="eyebrow">合成样例 · 同一 App 的两种角色</p><h1>我的衣柜</h1></div>{admin && <button className="primary" onClick={() => act(async () => {
      const item = await api('/api/admin/wardrobe', { method: 'POST', body: JSON.stringify({ title: '新的衣物草稿' }) }); navigate(`/wardrobe/${item.id}`);
    }, '已创建草稿')}>新建衣物</button>}</div>
    <p>{admin ? '编辑草稿不会改变已发布版本，点击发布后访客才会看到。' : '这里展示作者已经发布的衣物和搭配。'}</p>
    {error && <p role="alert">{error}</p>}{notice && <p role="status">{notice}</p>}
    {detailId ? <>
      <button onClick={() => navigate('/wardrobe')}>← 返回衣柜列表</button>
      {selected ? <div className="item-detail" key={`${selected.id}-${selected.updatedAt}-${revision}`}>
        {selected.imageUrl ? <img className="garment-image" alt={selected.title} src={selected.imageUrl}/> : <div className="garment-placeholder" aria-label="合成衣物占位图">👕</div>}
        {admin ? <form className="editor" onSubmit={event => {
          event.preventDefault(); const form = new FormData(event.currentTarget);
          act(() => api(`/api/admin/wardrobe/${selected.id}`, { method: 'PATCH', body: JSON.stringify({ title: form.get('title'), description: form.get('description'), privateNote: form.get('privateNote') }) }), '草稿已保存；公开内容尚未改变');
        }}>
          <label>衣物名称<input name="title" defaultValue={selected.title} required maxLength={120}/></label>
          <label>公开描述<textarea name="description" defaultValue={selected.description}/></label>
          <label>私有备注<textarea name="privateNote" defaultValue={selected.privateNote}/></label>
          <label>上传 PNG 样图（小于 1 MB）<input type="file" accept="image/png" onChange={event => {
            const file = event.target.files[0]; if (!file) return;
            act(async () => { const buffer = await file.arrayBuffer(); const bytes = new Uint8Array(buffer); let binary = ''; for (const byte of bytes) binary += String.fromCharCode(byte); await api(`/api/admin/wardrobe/${selected.id}/image`, { method: 'POST', body: JSON.stringify({ base64: btoa(binary) }) }); }, '图片已上传到草稿');
          }}/></label>
          <div className="actions"><button type="submit">保存草稿</button><button className="primary" type="button" onClick={() => act(() => api(`/api/admin/wardrobe/${selected.id}/publish`, { method: 'POST', body: '{}' }), '已发布，访客现在可以查看')}>发布已保存草稿</button>
          {selected.published && <button type="button" onClick={() => act(() => api(`/api/admin/wardrobe/${selected.id}/unpublish`, { method: 'POST', body: '{}' }), '已下架，公开图片入口同时关闭')}>下架</button>}</div>
          <p>发布状态：{selected.published ? '有已发布版本' : '仅草稿'}</p>
        </form> : <><h2>{selected.title}</h2><p>{selected.description}</p><a href={`/wardrobe/${selected.id}`} onClick={event => { event.preventDefault(); navigate(`/wardrobe/${selected.id}`); }}>此衣物的永久链接</a></>}
      </div> : <p role="status">内容不存在或未发布。</p>}
    </> : <div className="wardrobe-grid">{items.map(item => <a key={item.id} className="garment-card" href={`/wardrobe/${item.id}`} onClick={event => { event.preventDefault(); navigate(`/wardrobe/${item.id}`); }}>
      {item.imageUrl ? <img alt="" src={item.imageUrl}/> : <span className="card-emoji" aria-hidden="true">👕</span>}
      <h2>{item.title}</h2><p>{item.description || '尚未填写描述'}</p>{admin && <span>{item.published ? '已发布' : '草稿'}</span>}
    </a>)}</div>}
  </section>;
}

const blogApp = new App('博客', 'blog', Blog).setIconUrl('/blog.svg').setWindowOptions({ size: new Vector2(780, 610) });
const wardrobeApp = new App('衣柜', 'wardrobe', Wardrobe).setIconUrl('/wardrobe.svg').setWindowOptions({ size: new Vector2(860, 650) });
const apps = [blogApp, wardrobeApp];
const config = {
  apps: { apps }, tracking: { enabled: false }, windows: { minScreenSize: new Vector2(700, 450) },
  virtualDrive: { saveData: false, defaultData: {
    includePicturesFolder: false, includeVideoFolder: false, includeAudioFolder: false,
    includeDocumentsFolder: false, includeDesktopFolder: false, includeSourceTree: false, includeScriptsFolder: false,
    loadData: root => {
      root.navigate('~').createFolder('Desktop');
      root.navigate('~/.config/desktop.xml').setContent('<options><wallpaper>/wallpaper.svg</wallpaper><show-icons>false</show-icons></options>');
    },
  } },
};

function Scene() {
  const { path, navigate, navigationRevision } = useApp();
  const windows = useWindowsManager();
  useEffect(() => {
    if (!windows) return;
    if (path === '/') { windows.minimizeAll(); return; }
    const id = path.startsWith('/blog') ? 'blog' : path.startsWith('/wardrobe') ? 'wardrobe' : null;
    if (!id) return;
    const current = windows.getAppWindowId(id);
    if (current) { windows.setMinimized(current, false); windows.focus(current); }
    else windows.open(id);
  }, [path, windows, navigationRevision]);
  return <><Desktop/><div className="welcome-panel"><p className="eyebrow">HI · YINCAN / 选型实验</p><h1>内容，是这个桌面的主角。</h1><p>两个应用，一套窗口。<br/>访客浏览公开内容，作者登录后管理。</p><nav aria-label="内容应用">
    <a href="/blog/validation-note" onClick={event => { event.preventDefault(); navigate('/blog/validation-note'); }}><img src="/blog.svg" alt=""/><strong>博客</strong><span>阅读一篇文章</span></a>
    <a href="/wardrobe" onClick={event => { event.preventDefault(); navigate('/wardrobe'); }}><img src="/wardrobe.svg" alt=""/><strong>衣柜</strong><span>浏览与管理衣物</span></a>
  </nav><SessionBar/><p className="footnote">本地研究原型 · 全部为合成内容 · 非正式产品</p></div><WindowsView/><ModalsView/><Taskbar/></>;
}

createRoot(document.getElementById('root')).render(<Provider><ProzillaOS systemName="个人展示 OS 实验" tagLine="内容展示与管理" config={config}><Scene/></ProzillaOS></Provider>);
