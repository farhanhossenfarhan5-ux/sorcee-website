const pages=["overview","marketing","buyers","email","reports","settings"];
const titles={overview:"Overview",marketing:"Marketing approvals",buyers:"Buyer workspace",email:"Email approvals",reports:"Daily reports",settings:"Settings & safety"};
let drafts=[
{id:1,channel:"Facebook",title:"Sample Facebook draft",body:"Looking for a reliable apparel sourcing partner in Bangladesh? SORCEE coordinates with local factories for custom apparel orders. Minimum order quantity: 50 pieces. Send us your requirements to get started.",status:"Sample only"},
{id:2,channel:"Instagram",title:"Sample Instagram draft",body:"Connecting Global Brands with Trusted Local Factories. Apparel sourcing coordination from Bangladesh. MOQ: 50 pieces. Contact SORCEE for your next collection.",status:"Sample only"}
];
function toast(t){const el=document.getElementById("toast");el.textContent=t;el.classList.add("show");setTimeout(()=>el.classList.remove("show"),2600)}
function card(d){return '<article class="card"><div class="card-head"><span class="eyebrow">'+d.channel.toUpperCase()+' DRAFT</span><span class="pill">'+d.status+'</span></div><h3>'+escapeHtml(d.title)+'</h3><p>'+escapeHtml(d.body)+'</p><small>নমুনা খসড়া—এটি বাস্তব পোস্ট নয়। অনুমোদন বাটন শুধু এই ব্রাউজারে পরীক্ষামূলকভাবে কাজ করে।</small></article>'}
function escapeHtml(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]))}
function render(){document.getElementById("postCount").textContent="0";document.getElementById("pendingTotal").textContent="0";document.getElementById("mailCount").textContent="0";document.getElementById("marketingList").innerHTML=drafts.map(card).join("");document.getElementById("attention").innerHTML='<div class="empty"><h3>কোনো বাস্তব অনুমোদন অপেক্ষমাণ নেই</h3><p>AI-এর বাস্তব খসড়া ও নিরাপদ অনুমোদন সংযোগ এখনো তৈরি হচ্ছে। নিচের নমুনাগুলো শুধু নকশা দেখানোর জন্য।</p></div>'}
function showStatus(s){
 if(!s)return;
 const ai=escapeHtml(s.ai_status||"No report yet"), fb=escapeHtml(s.facebook_status||"Unknown"), ig=escapeHtml(s.instagram_status||"Unknown"), mail=escapeHtml(s.email_status||"Unknown");
 const reportDate=escapeHtml(s.date||"Unknown");
 const reportBox=document.querySelector("#reports .report");
 reportBox.innerHTML='<div><span class="eyebrow">LATEST AGENT REPORT · '+reportDate+'</span><h3>'+escapeHtml(s.mode||"Unknown mode")+'</h3><p><b>AI:</b> '+ai+'</p><p><b>Facebook:</b> '+fb+'</p><p><b>Instagram:</b> '+ig+'</p><p><b>Approved emails sent:</b> '+escapeHtml(s.approved_emails_sent??0)+'</p><p><b>Email:</b> '+mail+'</p><p><b>LinkedIn:</b> '+escapeHtml(s.linkedin_status||"Unknown")+'</p><a href="'+escapeHtml(s.report_file||"../sorcee-agent/output/")+'" target="_blank" rel="noopener">রিপোর্ট ফাইল খুলুন ↗</a></div><span class="tag">'+escapeHtml(s.mode||"STATUS")+'</span>';
 const welcome=document.querySelector("#overview .stats article:nth-child(2) strong");if(welcome)welcome.textContent="0";
 const statusLine=document.querySelector("#overview .activity");if(statusLine){statusLine.innerHTML='<div><i class="ok">✓</i><span><b>Latest agent run · '+reportDate+'</b><small>'+ai+'</small></span><time>'+escapeHtml(s.mode||"")+'</time></div><div><i class="warn">!</i><span><b>Facebook</b><small>'+fb+'</small></span><time>Social</time></div><div><i class="warn">!</i><span><b>Instagram</b><small>'+ig+'</small></span><time>Social</time></div><div><i class="ok">✓</i><span><b>Approved emails sent</b><small>'+escapeHtml(s.approved_emails_sent??0)+'</small></span><time>Email</time></div>'}
}
document.querySelectorAll(".nav").forEach(b=>b.addEventListener("click",()=>{document.querySelectorAll(".nav").forEach(x=>x.classList.remove("active"));b.classList.add("active");pages.forEach(p=>document.getElementById(p).classList.toggle("show",p===b.dataset.page));document.getElementById("pageTitle").textContent=titles[b.dataset.page];window.scrollTo(0,0)}));
render();
fetch("../sorcee-agent/output/dashboard-status.json",{cache:"no-store"}).then(r=>{if(!r.ok)throw new Error("No report yet");return r.json()}).then(showStatus).catch(()=>{const note=document.querySelector("#reports .note");if(note)note.textContent="এখনো dashboard-status.json পাওয়া যায়নি। পরবর্তী সফল agent run-এর পর এখানে সর্বশেষ রিপোর্ট দেখা যাবে।"});
