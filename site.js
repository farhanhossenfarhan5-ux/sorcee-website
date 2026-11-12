(function(){
var C=window.SORCEE_CONFIG||{},d=document,L={get:function(k){try{return localStorage.getItem(k)}catch(e){return null}},set:function(k,v){try{localStorage.setItem(k,v)}catch(e){}}};
function setLang(l){d.documentElement.lang=l;if(d.body)d.body.classList.toggle('is-bn',l==='bn');L.set('lang',l);
d.querySelectorAll('[data-en]').forEach(function(o){o.textContent=o.getAttribute('data-'+l)});
d.querySelectorAll('[data-phen]').forEach(function(i){i.placeholder=i.getAttribute('data-ph'+l)||''});}
var s=L.get('lang')||'en';setLang(s==='bn'?'bn':'en');
d.querySelectorAll('[data-set]').forEach(function(b){b.addEventListener('click',function(){setLang(b.dataset.set)})});
var bg=d.querySelector('.burger'),nv=d.getElementById('nav');
if(bg&&nv)bg.addEventListener('click',function(){var o=nv.classList.toggle('open');bg.setAttribute('aria-expanded',o)});
var f=d.getElementById('quote');if(!f)return;
var q=new URLSearchParams(location.search).get('category');if(q)f.category.value=q;
var st=d.getElementById('status');
function msg(t,c){st.textContent=t;st.className='status '+(c||'')}
function bn(){return d.documentElement.lang==='bn'}
function valid(){var ok=true;f.querySelectorAll('[required]').forEach(function(el){var bad=!el.value.trim();
if(el.name==='email'&&el.value&&!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(el.value))bad=true;
el.closest('.f').classList.toggle('invalid',bad);if(bad)ok=false});
var n=parseInt(f.quantity.value,10);if(!(n>=50)){f.quantity.closest('.f').classList.add('invalid');ok=false}
if(!ok)msg(bn()?'অনুগ্রহ করে লাল ঘরগুলো ঠিক করুন। পরিমাণ ন্যূনতম ৫০ পিস হতে হবে।':'Please fix the highlighted fields. Quantity must be at least 50 pieces.','err');return ok}
function text(){var v=function(n){return(f[n].value||'-').trim()};
return ['Hello SORCEE, I would like to request a quote.','','Name: '+v('fullName'),'Business: '+v('business'),'Email: '+v('email'),'Phone/WhatsApp: '+v('phone'),'Country: '+v('country'),
'Product category: '+v('category'),'Estimated quantity: '+v('quantity'),'Specifications: '+v('specs'),'Fabric: '+v('fabric'),'Size breakdown: '+v('sizes'),'Colors: '+v('colors'),
'Customization: '+v('custom'),'Message: '+v('message')].join('\n')}
d.getElementById('sendWa').addEventListener('click',function(){if(!valid())return;
window.open('https://wa.me/8801340354289?text='+encodeURIComponent(text()),'_blank','noopener');msg(bn()?'হোয়াটসঅ্যাপ খোলা হয়েছে। সেখানে বার্তাটি পাঠান।':'WhatsApp opened. Press send in WhatsApp to deliver your inquiry.','ok')});
d.getElementById('sendEmail').addEventListener('click',function(){if(!valid())return;
if(!C.emailEndpoint){d.getElementById('pending').hidden=false;msg(bn()?'ইমেইল ডেলিভারি এখনও চালু হয়নি।':'Email delivery is not configured yet. Nothing was sent.','err');return}
if(f._honey.value)return;var fd=new FormData(f);fd.append('_subject','SORCEE quote request');fd.append('_captcha','false');
msg(bn()?'পাঠানো হচ্ছে...':'Sending...');
fetch(C.emailEndpoint,{method:'POST',body:fd,headers:{Accept:'application/json'}}).then(function(r){if(!r.ok)throw 0;msg(bn()?'ধন্যবাদ। আপনার ইনকোয়ারি পাঠানো হয়েছে।':'Thank you. Your inquiry was sent.','ok');f.reset()})
.catch(function(){msg(bn()?'পাঠানো যায়নি। হোয়াটসঅ্যাপ বা ইমেইল ব্যবহার করুন।':'Sending failed. Please use WhatsApp or email us directly.','err')})});
})();