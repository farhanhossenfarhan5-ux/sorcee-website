/* SORCEE private CRM — Supabase Auth + RLS protected */
(function(){
'use strict';
const cfg=window.SORCEE_CONTROL_CONFIG||{};
const $=id=>document.getElementById(id);
const loginGate=$('loginGate'),appShell=$('appShell'),loginForm=$('loginForm'),loginStatus=$('loginStatus');
const statusLabels={new:'New',contacted:'Contacted',qualified:'Qualified',quotation_sent:'Quotation sent',sample_requested:'Sample requested',negotiation:'Negotiation',confirmed:'Confirmed',completed:'Completed',lost:'Lost',on_hold:'On hold'};
const statuses=Object.keys(statusLabels);
let sb=null,currentUser=null,buyers=[],activities=[];
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const fmtDate=s=>{if(!s)return '—';const d=new Date(s);return Number.isNaN(d.getTime())?'—':d.toLocaleDateString('en-GB',{day:'2-digit',month:'short',year:'numeric'})};
function toast(t){const el=$('toast');el.textContent=t;el.classList.add('show');setTimeout(()=>el.classList.remove('show'),2800)}
function setLoginMessage(t,isError=true){loginStatus.textContent=t;loginStatus.className='form-status'+(isError?' error':' success')}
function showLogin(message){appShell.hidden=true;loginGate.hidden=false;if(message)setLoginMessage(message)}
function showApp(user){currentUser=user;loginGate.hidden=true;appShell.hidden=false;$('userEmail').textContent=user.email||'Admin';}
function isAdmin(user){return !!(user&&user.app_metadata&&user.app_metadata.role==='admin')}
async function enterWithSession(session){
 if(!session)return showLogin();
 const {data,error}=await sb.auth.getUser(session.access_token);
 if(error||!isAdmin(data.user)){
   await sb.auth.signOut();
   return showLogin('এই অ্যাকাউন্টে SORCEE CRM ব্যবহারের অনুমতি নেই।');
 }
 showApp(data.user);
 await loadData();
}
async function login(e){
 e.preventDefault();
 const email=$('loginEmail').value.trim(),password=$('loginPassword').value;
 if(!email||!password)return;
 const button=$('loginButton');button.disabled=true;button.textContent='প্রবেশ যাচাই হচ্ছে…';setLoginMessage('নিরাপদ সংযোগ তৈরি হচ্ছে…',false);
 try{
   const {data,error}=await sb.auth.signInWithPassword({email,password});
   if(error)throw error;
   if(!isAdmin(data.user)){await sb.auth.signOut();throw new Error('এই অ্যাকাউন্টে প্রশাসকের অনুমতি নেই।');}
   showApp(data.user);setLoginMessage('',false);await loadData();
 }catch(err){setLoginMessage(err.message||'প্রবেশ করা যায়নি। আবার চেষ্টা করুন।');}
 finally{button.disabled=false;button.textContent='নিরাপদে প্রবেশ করুন';}
}
async function logout(){await sb.auth.signOut();currentUser=null;buyers=[];activities=[];showLogin('আপনি নিরাপদে লগআউট করেছেন।');}
function gotoPage(name){
 document.querySelectorAll('.nav').forEach(x=>x.classList.toggle('active',x.dataset.page===name));
 document.querySelectorAll('.page').forEach(x=>x.classList.toggle('show',x.id===name));
 $('pageTitle').textContent=({overview:'Overview',buyers:'Buyer CRM',marketing:'Marketing drafts',email:'Email approvals',reports:'Daily reports',settings:'Security & settings'})[name]||'Overview';
 window.scrollTo(0,0);
 if(name==='buyers')renderBuyers();
}
function updateStats(){
 $('buyerCount').textContent=buyers.length;
 $('statTotal').textContent=buyers.length;
 $('statNew').textContent=buyers.filter(x=>x.status==='new').length;
 $('statQuote').textContent=buyers.filter(x=>x.status==='quotation_sent').length;
 $('statConfirmed').textContent=buyers.filter(x=>['confirmed','completed'].includes(x.status)).length;
}
function renderRecent(){
 const rows=buyers.slice(0,5);
 $('recentBuyers').innerHTML=rows.length?rows.map(b=>'<article class="card compact"><div class="card-head"><span class="eyebrow">INQUIRY #'+esc(b.inquiry_number)+'</span><span class="pill">'+esc(statusLabels[b.status]||b.status)+'</span></div><h3>'+esc(b.buyer_name)+'</h3><p>'+esc(b.company_name||b.buyer_email)+' · '+esc(b.country||'Country not set')+'</p><small>'+esc(b.product_category||'Apparel')+' · '+esc(b.quantity||'Quantity not set')+' pcs · '+fmtDate(b.created_at)+'</small></article>').join(''):'<div class="empty"><h3>এখনো কোনো buyer lead নেই</h3><p>Buyer CRM থেকে প্রথম ক্রেতার তথ্য যোগ করুন।</p><button class="primary" data-goto="buyers">ক্রেতা যোগ করুন</button></div>';
}
function renderBuyers(){
 const q=($('buyerSearch').value||'').trim().toLowerCase(),st=$('statusFilter').value;
 const rows=buyers.filter(b=>(!st||b.status===st)&&(!q||[b.buyer_name,b.buyer_email,b.company_name,b.country,b.product_name,b.product_category].join(' ').toLowerCase().includes(q)));
 $('buyerList').innerHTML=rows.length?rows.map(b=>{
   const options=statuses.map(s=>'<option value="'+s+'" '+(b.status===s?'selected':'')+'>'+esc(statusLabels[s])+'</option>').join('');
   const notes=activities.filter(a=>a.inquiry_id===b.id).slice(0,2);
   return '<article class="buyer-card" data-buyer="'+esc(b.id)+'">'+
    '<div class="buyer-top"><div><span class="eyebrow">INQUIRY #'+esc(b.inquiry_number)+'</span><h3>'+esc(b.buyer_name)+'</h3><p>'+esc(b.company_name||'Company not set')+' · '+esc(b.country||'Country not set')+'</p></div><span class="pill">'+esc(statusLabels[b.status]||b.status)+'</span></div>'+
    '<div class="buyer-meta"><a href="mailto:'+esc(b.buyer_email)+'">'+esc(b.buyer_email)+'</a>'+(b.whatsapp?'<span>'+esc(b.whatsapp)+'</span>':'')+'<span>'+esc(b.product_category||'Apparel')+(b.product_name?' · '+esc(b.product_name):'')+'</span><span>Qty: '+esc(b.quantity||'—')+' pcs</span><span>Added: '+fmtDate(b.created_at)+'</span></div>'+
    (b.message?'<p class="buyer-message">'+esc(b.message)+'</p>':'')+
    '<div class="buyer-edit"><label>অবস্থা<select data-status="'+esc(b.id)+'">'+options+'</select></label><label>পরবর্তী যোগাযোগ<input type="date" data-followup="'+esc(b.id)+'" value="'+esc(b.next_follow_up_at?String(b.next_follow_up_at).slice(0,10):'')+'"></label><button class="primary small" data-save="'+esc(b.id)+'">পরিবর্তন সংরক্ষণ</button></div>'+
    '<div class="note-entry"><textarea rows="2" data-note="'+esc(b.id)+'" placeholder="এই ক্রেতা সম্পর্কে ব্যক্তিগত নোট লিখুন…"></textarea><button class="outline small" data-add-note="'+esc(b.id)+'">নোট যোগ করুন</button></div>'+
    (notes.length?'<div class="note-history">'+notes.map(a=>'<p><b>'+esc(a.activity_type==='status_change'?'Status update':'Note')+'</b> · '+esc(a.details)+' <small>'+fmtDate(a.created_at)+'</small></p>').join('')+'</div>':'')+
   '</article>';
 }).join(''):'<div class="empty"><div>♧</div><h3>কোনো ক্রেতা পাওয়া যায়নি</h3><p>সার্চ বা ফিল্টার পরিবর্তন করুন, অথবা নতুন ক্রেতা যোগ করুন।</p></div>';
}
async function loadData(){
 $('buyerList').innerHTML='<div class="empty">ক্রেতার তথ্য লোড হচ্ছে…</div>';
 const [leadRes,activityRes]=await Promise.all([
  sb.from('buyer_inquiries').select('*').order('created_at',{ascending:false}).limit(250),
  sb.from('buyer_inquiry_activities').select('id,inquiry_id,activity_type,details,created_at').order('created_at',{ascending:false}).limit(300)
 ]);
 if(leadRes.error){$('buyerList').innerHTML='<div class="empty"><h3>তথ্য লোড করা যায়নি</h3><p>'+esc(leadRes.error.message)+'</p></div>';toast('CRM data access error');return;}
 buyers=leadRes.data||[];activities=activityRes.error?[]:(activityRes.data||[]);
 updateStats();renderRecent();renderBuyers();
}
function openModal(){$('leadModal').hidden=false;$('leadFormStatus').textContent='';document.body.classList.add('modal-open');}
function closeModal(){$('leadModal').hidden=true;document.body.classList.remove('modal-open');}
async function saveLead(e){
 e.preventDefault();const form=e.currentTarget,button=$('saveLeadButton'),fd=new FormData(form),v=Object.fromEntries(fd.entries());
 const payload={buyer_name:v.buyer_name.trim(),buyer_email:v.buyer_email.trim(),company_name:v.company_name.trim()||null,country:v.country.trim()||null,whatsapp:v.whatsapp.trim()||null,product_category:v.product_category,product_name:v.product_name.trim()||null,quantity:v.quantity?Number(v.quantity):null,target_price:v.target_price?Number(v.target_price):null,currency:v.currency,source:v.source,message:v.message.trim()||null};
 button.disabled=true;button.textContent='সংরক্ষণ হচ্ছে…';
 try{
  const {data,error}=await sb.from('buyer_inquiries').insert(payload).select().single();
  if(error)throw error;
  await sb.from('buyer_inquiry_activities').insert({inquiry_id:data.id,activity_type:'other',details:'Buyer record created in SORCEE Control.',created_by:currentUser.id});
  closeModal();form.reset();await loadData();toast('নতুন ক্রেতার তথ্য সংরক্ষণ হয়েছে।');
 }catch(err){$('leadFormStatus').textContent=err.message||'তথ্য সংরক্ষণ করা যায়নি।';$('leadFormStatus').className='form-status error';}
 finally{button.disabled=false;button.textContent='ক্রেতার তথ্য সংরক্ষণ';}
}
async function saveBuyer(id){
 const statusEl=document.querySelector('[data-status="'+CSS.escape(id)+'"]'),dateEl=document.querySelector('[data-followup="'+CSS.escape(id)+'"]'),old=buyers.find(x=>x.id===id);
 if(!old||!statusEl)return;
 const nextStatus=statusEl.value,nextDate=dateEl.value||null;
 const patch={status:nextStatus,next_follow_up_at:nextDate?new Date(nextDate+'T12:00:00').toISOString():null,updated_at:new Date().toISOString()};
 const {error}=await sb.from('buyer_inquiries').update(patch).eq('id',id);
 if(error){toast('সংরক্ষণ হয়নি: '+error.message);return;}
 if(old.status!==nextStatus){await sb.from('buyer_inquiry_activities').insert({inquiry_id:id,activity_type:'status_change',details:'Status changed: '+(statusLabels[old.status]||old.status)+' → '+(statusLabels[nextStatus]||nextStatus),previous_status:old.status,new_status:nextStatus,created_by:currentUser.id});}
 await loadData();toast('ক্রেতার তথ্য আপডেট হয়েছে।');
}
async function addNote(id){
 const el=document.querySelector('[data-note="'+CSS.escape(id)+'"]'),details=(el&&el.value||'').trim();if(!details){toast('আগে একটি নোট লিখুন।');return;}
 const {error}=await sb.from('buyer_inquiry_activities').insert({inquiry_id:id,activity_type:'note',details,created_by:currentUser.id});
 if(error){toast('নোট সংরক্ষণ হয়নি: '+error.message);return;}
 await loadData();toast('নোট সংরক্ষণ হয়েছে।');
}
function showReport(s){
 if(!s)return;
 const date=esc(s.date||'Unknown'),mode=esc(s.mode||'Unknown mode');
 $('reportBox').innerHTML='<div><span class="eyebrow">LATEST AGENT REPORT · '+date+'</span><h3>'+mode+'</h3><p><b>AI:</b> '+esc(s.ai_status||'Unknown')+'</p><p><b>Facebook:</b> '+esc(s.facebook_status||'Unknown')+'</p><p><b>Instagram:</b> '+esc(s.instagram_status||'Unknown')+'</p><p><b>Approved emails sent:</b> '+esc(s.approved_emails_sent??0)+'</p><p><b>Email:</b> '+esc(s.email_status||'Unknown')+'</p><p><b>LinkedIn:</b> '+esc(s.linkedin_status||'Unknown')+'</p><a href="'+esc(s.report_file||'../sorcee-agent/output/')+'" target="_blank" rel="noopener">রিপোর্ট ফাইল খুলুন ↗</a></div><span class="tag">'+mode+'</span>';
}
async function init(){
 if(!cfg.url||!cfg.publishableKey||!window.supabase){showLogin('নিরাপদ সংযোগের সেটিং পাওয়া যায়নি।');return;}
 sb=window.supabase.createClient(cfg.url,cfg.publishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}});
 loginForm.addEventListener('submit',login);
 $('logoutButton').addEventListener('click',logout);
 document.querySelectorAll('.nav').forEach(b=>b.addEventListener('click',()=>gotoPage(b.dataset.page)));
 document.addEventListener('click',e=>{
  const go=e.target.closest('[data-goto]');if(go)gotoPage(go.dataset.goto);
  if(e.target.closest('[data-close-modal]'))closeModal();
  const save=e.target.closest('[data-save]');if(save)saveBuyer(save.dataset.save);
  const note=e.target.closest('[data-add-note]');if(note)addNote(note.dataset.addNote);
 });
 $('newLeadButton').addEventListener('click',openModal);
 $('leadForm').addEventListener('submit',saveLead);
 $('buyerSearch').addEventListener('input',renderBuyers);
 $('statusFilter').addEventListener('change',renderBuyers);
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('leadModal').hidden)closeModal()});
 fetch('../sorcee-agent/output/dashboard-status.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('No report');return r.json()}).then(showReport).catch(()=>{$('reportNote').textContent='এখনো কোনো নতুন এজেন্ট রিপোর্ট পাওয়া যায়নি।'});
 const {data:{session}}=await sb.auth.getSession();
 if(session){
  const {data,error}=await sb.auth.refreshSession();
  if(!error&&data.session)await enterWithSession(data.session);else await enterWithSession(session);
 }else showLogin();
}
init();
})();