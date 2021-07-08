(function hideScroll(){
    const main = document.querySelector('.main-view-container__scroll-node-child');
    if (!main || !Spicetify.Platform?.History || !Spicetify.Menu) {
        setTimeout(hideScroll, 1000);
        return;
    }
    document.addEventListener('mousemove',() => {
          let sbarlist = document.querySelectorAll(".os-scrollbar.os-scrollbar-vertical")
          for(const sbar of sbarlist){
             if(sbar.classList.contains('active'))
                 sbar.childNodes[0].classList.add("scroll-drag")
             else
                 sbar.childNodes[0].classList.remove("scroll-drag")
          } 
          removeEle(["#ad-tracking-pixel",".ad-iframe"])
          checkHover(document.querySelector(".Root__nav-bar"),document.querySelectorAll(".os-scrollbar.os-scrollbar-vertical")[0]);
          checkHover(document.querySelector(".Root__main-view"),document.querySelectorAll(".os-scrollbar.os-scrollbar-vertical")[1]);
    });     
    function checkHover(myDiv,toHide){
         const isHover = e => e.parentElement.querySelector(':hover') === e;   
         const hovered = isHover(myDiv);
         if(hovered || toHide.classList.contains('active'))
              toHide.style.display="block";
         else
              toHide.style.display="none"; 
     }
     function removeEle(selList){
        	for(const selector of selList){
        		eleList = document.querySelectorAll(selector)
        		for(const element of eleList)
        			element.remove()
        	}	
        } 
})();