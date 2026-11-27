(function(){
var C=window.SORCEE_CONFIG||{},d=document,L={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
function setLang(l){d.documentElement.lang=l;if(d.body)d.body.classList.toggle('is-bn',l==='bn');L.set('lang',l);
d.querySelectorAll('[data-en]').forEach(function(o){o.textContent=o.getAttribute('data-'+l)});
d.querySelectorAll('[data-phen]').forEach(function(i){i.placeholder=i.getAttribute('data-ph'+l)||''});}
var s=L.get('lang')||'en';setLang(s==='bn'?'bn':'en');
d.querySelectorAll('[data-set]').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.set)})});
var bg=d.querySelector('.burger'),nv=d.getElementById('nav');
if(bg&&nv)bg.addEventListener('click',function(){var o=nv.classList.toggle('open');bg.setAttribute('aria-expanded',o)});
var f=d.getElementById('quote');if(f){
var q=new URLSearchParams(location.search).get('category');if(q)f.category.value=q;
var st=d.getElementById('status');
function msg(t,c){st.textContent=t;st.className='status '+(c||'')}
function bn(){return d.documentElement.lang==='bn'}
function valid(){var ok=true;f.querySelectorAll('[required]').forEach(function(el){var bad=!el.value.trim();
if(el.name==='email'&&el.value&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value))bad=true;
el.closest('.f').classList.toggle('invalid',bad);if(bad)ok=false});
var n=parseInt(f.quantity.value,10),sampleOnly=f.service.value==='Sample development only',minimum=sampleOnly?1:50;if(!(n>=minimum)){f.quantity.closest('.f').classList.add('invalid');ok=false}
if(!ok)msg(bn()?(sampleOnly?'অনুগ্রহ করে লাল ঘরগুলো ঠিক করুন। নমুনার পরিমাণ কমপক্ষে ১ হতে হবে।':'অনুগ্রহ করে লাল ঘরগুলো ঠিক করুন। উৎপাদনের পরিমাণ ন্যূনতম ৫০ পিস হতে হবে।'):(sampleOnly?'Please fix the highlighted fields. Sample quantity must be at least 1.':'Please fix the highlighted fields. Production quantity must be at least 50 pieces.'),'err');return ok}
function text(){var v=function(n){return(f[n].value||'-').trim()};
return ['Hello SORCEE, I would like to request a quote.','','Name: '+v('fullName'),'Business: '+v('business'),'Email: '+v('email'),'Phone/WhatsApp: '+v('phone'),'Country: '+v('country'),
'Requested service: '+v('service'),'Product category: '+v('category'),'Estimated quantity: '+v('quantity'),'Specifications: '+v('specs'),'Fabric: '+v('fabric'),'Size breakdown: '+v('sizes'),'Colors: '+v('colors'),
'Customization: '+v('custom'),'Message: '+v('message')].join('\n')}
d.getElementById('sendWa').addEventListener('click',function(){if(!valid())return;
window.open('https://wa.me/8801340354289?text='+encodeURIComponent(text()),'_blank','noopener');msg(bn()?'হোয়াটসঅ্যাপ খোলা হয়েছে। সেখানে বার্তাটি পাঠান।':'WhatsApp opened. Press send in WhatsApp to deliver your inquiry.','ok')});
d.getElementById('sendEmail').addEventListener('click',async function(){
if(!valid())return;
if(f._honey.value)return;
if(!C.emailEndpoint){msg(bn()?'ইমেইল ব্যবস্থা এখনো কনফিগার করা হয়নি।':'Email delivery is not configured yet.','err');return}
var button=this,files=f.querySelector('input[name="files"]');
button.disabled=true;
msg(bn()?'ইনকোয়ারি পাঠানো হচ্ছে...':'Sending your inquiry...');
var payload={};
new FormData(f).forEach(function(value,key){
if(key!=='files'&&key!=='_honey'&&typeof value==='string')payload[key]=value;
});
payload._subject='New SORCEE website inquiry';
payload._replyto=f.email.value;
payload._url=location.href;
payload._honey=f._honey.value;
if(files&&files.files&&files.files.length){
payload.reference_files_selected=Array.from(files.files).map(function(file){return file.name}).join(', ');
}
async function sendEmail(){
try{
var response=await fetch(C.emailEndpoint,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(payload)});
var result=await response.json();
return {ok:response.ok&&(result.success==='true'||result.success===true),message:result.message||'Email service did not accept the inquiry.'};
}catch(error){return {ok:false,message:'Email connection failed.'}}
}
async function saveToCrm(){
if(!C.inquiryEndpoint||!C.publishableKey)return {ok:false,message:'CRM endpoint is not configured.'};
try{
var response=await fetch(C.inquiryEndpoint,{method:'POST',headers:{'Content-Type':'application/json','apikey':C.publishableKey},body:JSON.stringify(payload)});
var result=await response.json();
return {ok:response.ok&&result.success===true,number:result.inquiry_number||null,message:result.message||'CRM could not save the inquiry.'};
}catch(error){return {ok:false,message:'CRM connection failed.'}}
}
try{
var results=await Promise.all([sendEmail(),saveToCrm()]);
var emailResult=results[0],crmResult=results[1];
if(emailResult.ok&&crmResult.ok){
msg(bn()?'ধন্যবাদ! আপনার ইনকোয়ারি SORCEE-তে পাঠানো ও CRM-এ সংরক্ষণ করা হয়েছে।':'Thank you! Your inquiry was emailed to SORCEE and saved in the buyer CRM.'+(crmResult.number?' Inquiry #'+crmResult.number:''),'ok');
f.reset();
}else if(emailResult.ok&&!crmResult.ok){
msg(bn()?'ইমেইল পাঠানো হয়েছে, তবে CRM-এ সংরক্ষণ হয়নি। অনুগ্রহ করে আবার পাঠাবেন না; SORCEE টিম এটি হাতে যোগ করবে।':'Your email was sent, but CRM sync failed. Please do not submit again; the SORCEE team will add it manually.','err');
button.disabled=true;
}else if(!emailResult.ok&&crmResult.ok){
msg(bn()?'আপনার ইনকোয়ারি CRM-এ সংরক্ষিত হয়েছে, কিন্তু ইমেইল নোটিফিকেশন পাঠানো যায়নি।':'Your inquiry was saved in the CRM, but the email notification could not be sent.'+(crmResult.number?' Inquiry #'+crmResult.number:''),'ok');
f.reset();
}else{
msg(bn()?'ইনকোয়ারি পাঠানো যায়নি। আবার চেষ্টা করুন অথবা WhatsApp ব্যবহার করুন।':'The inquiry could not be submitted. Please try again or use WhatsApp.','err');
}
}catch(error){
msg(bn()?'সংযোগে সমস্যা হয়েছে। আবার চেষ্টা করুন অথবা WhatsApp ব্যবহার করুন।':'A connection error occurred. Please try again or use WhatsApp.','err');
}finally{
if(!button.disabled)button.disabled=false;
}
});

}
/* SORCEE corporate reveal motion — gracefully falls back without observer support */
var reduceMotion=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
if(!reduceMotion){
  var revealItems=d.querySelectorAll('.sec .wrap > h2,.cat,.why > div,.steps > li,.two > div');
  if('IntersectionObserver' in window){
    var revealObserver=new IntersectionObserver(function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add('is-visible');
          revealObserver.unobserve(entry.target);
        }
      });
    },{root:null,rootMargin:'0px 0px -8% 0px',threshold:.08});
    revealItems.forEach(function(el){el.classList.add('sorcee-reveal');revealObserver.observe(el)});
  }
}
})();