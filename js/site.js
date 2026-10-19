(function(){
  var h=document.querySelector('header.site');
  function onS(){h.classList.toggle('scrolled',window.scrollY>8)}
  window.addEventListener('scroll',onS,{passive:true});onS();
})();
