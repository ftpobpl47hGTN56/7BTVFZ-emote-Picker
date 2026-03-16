(function() {
    const css = `
 

div#__emote_tooltip_iife__ {
   word-break: break-all;
   position: fixed;
   z-index: 9999999  !important;
   display: block;
   pointer-events: none;
   max-width: 220px;
   background: linear-gradient(205deg, rgb(64, 111, 118), rgb(59, 29, 71)) !important;
   color: #59d3c3 !important;
   border: 1px solid rgb(103, 169, 169);
   border-radius: 10px;
   padding: 12px 14px;
   color: rgb(239, 239, 241);
   font-family: Inter, Roobert, "Helvetica Neue", sans-serif;
   font-size: 14px  !important;
   line-height: 1.5;
   box-shadow: rgba(0, 0, 0, 0.65) 0px 6px 24px;
   transition: opacity 0.1s;
   opacity: 1;
   left: 312px;
   top: 338px;
   width: 235px !important;
}
   #sep-emote-popup {
        word-break: break-all;
        position: fixed;
        z-index: 9999999  !important;
        display: block;
        pointer-events: cursor   !important; 
        background: linear-gradient(190deg, rgb(94 55 79), rgb(55 38 54), rgb(34 28 48))  !important;
        color: #59d3c3 !important;
        border: 1px solid !important;
        border-radius: 10px   !important;
        padding: 35px 10px   !important;
        color: rgb(223 197 151)   !important;
        font-family: Inter, Roobert, "Helvetica Neue", sans-serif;
        font-size: 14px  !important;
        line-height: 1.5;
        box-shadow: rgba(0, 0, 0, 0.65) 0px 6px 24px   !important;
        transition: opacity 0.1s;
        opacity: 1;
        left: 312px;
        top: 338px;
        min-width: 350px  !important;
        max-width: 50px  !important;
        max-height: 480px  !important;
    }
    .dropped.svelte-smefbm {
        z-index: 999999 !important;
        position: absolute !important;
        top: 100% !important;
        margin: 0 !important;
        margin-top: .25rem !important;
        padding: 0 !important;
        border: var(--border-active) 1px solid !important;
        border-radius: .5rem !important;
        background-color: var(--bg-medium) !important;
        box-shadow: 4px 4px 8px #0000001a !important;
    }


   
 /*-------------------- hide sub gifted SPAM IN CHAT ------------*/
 
    `;
    
    const styleElement = document.createElement('style');
    styleElement.type = 'text/css';
    styleElement.innerHTML = css;
    document.head.appendChild(styleElement);


})();



 