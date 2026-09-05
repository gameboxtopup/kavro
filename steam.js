(async function(){
 const host=document.getElementById("steamPackages");
 try{
  const res=await fetch("https://kavro-api.onrender.com/api/product-items"); const items=await res.json();
  items.filter(x=>x.product?.slug==="steam").forEach(item=>{const el=document.createElement("button");el.type="button";el.className="package-item";el.dataset.name=item.title;el.dataset.price=`NPR ${item.price}`;el.innerHTML=`<div class="diamond">🎮 ${item.title}</div><div class="amount">NPR ${item.price}</div>`;host.appendChild(el);});
  const cards=host.querySelectorAll(".package-item"); cards.forEach(card=>card.onclick=()=>{cards.forEach(x=>x.classList.remove("active"));card.classList.add("active");document.getElementById("packageName").textContent=card.dataset.name;document.getElementById("packagePrice").textContent=card.dataset.price;});
 }catch(e){host.innerHTML="<p>Packages are temporarily unavailable. Please contact Kavro support.</p>";}
})();
