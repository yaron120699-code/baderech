/* בדרך · שורות מחברת
   הקווים ברקע (.ruled) מיושרים לטקסט: כל שורת טקסט ״יושבת״ על קו, כמו כתיבה במחברת.
   איך: הגובה של כל שורה בטקסט הוא כפולה של מרווח הקווים (--u, ב-CSS).
   הסקריפט מודד איפה יושבת השורה הראשונה של כל בלוק שמסומן data-rule,
   מזיז את הקווים כך שיעברו מתחת לבלוק הראשון, ומקרב את שאר הבלוקים לקו הקרוב (עד חצי שורה).
   בלי JS: הקווים פשוט נשארים ברקע, לא מיושרים. שום דבר לא נשבר. */
(function(){
  function firstText(el){
    var w=document.createTreeWalker(el,NodeFilter.SHOW_TEXT,{acceptNode:function(n){
      var p=n.parentElement; if(!p||p.closest('.sr,.fix,[aria-hidden="true"] .fix')) return NodeFilter.FILTER_REJECT;
      return /\S/.test(n.nodeValue)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT}});
    return w.nextNode();
  }
  function offsetIn(node,container){
    var y=0,el=node;
    while(el&&el!==container){y+=el.offsetTop;el=el.offsetParent}
    return el===container?y:null;
  }
  function baseline(block,container){
    var t=firstText(block); if(!t) return null;
    var probe=document.createElement('span');
    probe.style.cssText='display:inline-block;width:0;height:0;vertical-align:baseline;padding:0;margin:0;border:0';
    t.parentNode.insertBefore(probe,t);
    var y=offsetIn(probe,container);
    probe.remove();
    return y;
  }
  function align(container){
    var u=parseFloat(getComputedStyle(container).getPropertyValue('--u'));
    if(!u) return;
    var blocks=[].slice.call(container.querySelectorAll('[data-rule]'));
    if(!blocks.length) return;
    blocks.forEach(function(b){b.style.top=''});
    var b0=baseline(blocks[0],container);
    if(b0==null) return;
    var line=b0+3;                                   /* הקו עובר 3px מתחת לשורה, כמו במחברת */
    var y=((line-(u-1))%u+u)%u;
    container.style.setProperty('--rule-y',y+'px');
    blocks.slice(1).forEach(function(b){
      var bl=baseline(b,container); if(bl==null) return;
      var d=((bl-b0)%u+u)%u; if(d>u/2) d-=u;
      if(Math.abs(d)>.5) b.style.top=(-d)+'px';
    });
  }
  function run(root){
    (root||document).querySelectorAll('.ruled').forEach(align);
    if(root&&root.classList&&root.classList.contains('ruled')) align(root);
  }
  window.alignRules=run;
  var t;
  function soon(){clearTimeout(t);t=setTimeout(function(){run()},120)}
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',function(){run()}); else run();
  if(document.fonts&&document.fonts.ready) document.fonts.ready.then(function(){run()});
  window.addEventListener('load',function(){run()});
  window.addEventListener('resize',soon);
})();
