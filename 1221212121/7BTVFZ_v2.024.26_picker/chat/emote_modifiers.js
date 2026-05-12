// chat/emote_modifiers.js

 
const EmoteModifiers = {
    map: {
        // FFZ
        'ffzCursed': 'sep-mod-cursed',
        'ffzY': 'sep-mod-flip-y',
        'ffzX': 'sep-mod-flip-x',
        'ffzW': 'sep-mod-wide',
        'ffzSpin': 'sep-mod-spin',
        'ffzArrive': 'sep-mod-arrive',
        'ffzLeave': 'sep-mod-leave',
        'ffzSlide': 'sep-mod-slide',
        'ffzJam': 'sep-mod-jam',
        'ffzBounce': 'sep-mod-bounce',
        'ffzRainbow': 'sep-mod-rainbow',
        'ffzHyper': 'sep-mod-hyper',
        // BTTV
        's!': 'sep-mod-hyper',
        'c!': 'sep-mod-cursed',
        'h!': 'sep-mod-flip-x',
        'v!': 'sep-mod-flip-y',
        'l!': 'sep-mod-tilt-l', // Исправлено: наклон влево
        'r!': 'sep-mod-tilt-r', // Исправлено: наклон вправо
        'w!': 'sep-mod-wide',
        'p!': 'sep-mod-party',
        'R!': 'sep-mod-rainbow', // Радуга вынесена на заглавную R
        'z!': 'sep-mod-zw-flag', // Флаг для логики
        'Z':  'sep-mod-zw-flag'  
    },

    injectStyles() {
    if (document.getElementById('sep-modifiers-style')) return;
    const s = document.createElement('style');
    s.id = 'sep-modifiers-style';
    s.textContent = `
    /* В emote_modifiers.js → injectStyles(), добавить: */

/* Фикс: FFZ ставит max-height: 620px на все img в чате,
   возвращаем нормальный размер для sep-эмоутов */
.chat-line__message img.sep-emote-base {
    max-height: 64px !important;
  max-width: 620px !important; 
    height: 64px !important;
}

/* Для ffzW ширина уже выставлена через JS (width: 140.8px),
   но max-height не должен её ломать */
.chat-line__message img.sep-emote-base.sep-mod-ffzW {
    max-height: 64px !important;
    height: 64px !important;
    max-width: 320px !important;   /* разрешаем быть шире 320px */
width: 620px !important;
    object-fit: fill !important;
}

    .sep-emote-wrap .ffz--inline {
    display: inline-block !important;
    position: relative !important;
    z-index: 0 !important;
    }
    .sep-emote-wrap img.ffz-emote,
    .sep-emote-wrap img.ffz-emoji {
    vertical-align: middle !important;
    z-index: 999999 !important;
    position: relative !important;
    }
    .sep-emote-base {
    display: inline-block;
    transition: transform 0.2s;
    /* Переменные для комбинирования эффектов */
    --sep-scale-x: 1;
    --sep-scale-y: 1; 
    transform: scaleX(var(--sep-scale-x)) scaleY(var(--sep-scale-y)) rotate(var(--sep-rotate)) !important;
    }

    /* ----------- wide --------------*/
    .sep-mod-wide { 
    --sep-scale-x: 2.4;
    --sep-scale-y: 1.0;
    --sep-rotate: 0deg;
    margin: 0px -80px !important;   
    }
    .sep-emote-wrap:has(.sep-mod-wide) {
    margin-left: 150px !important;
    }

    .sep-mod-flip-x {
    --sep-scale-x: -1 !important; /* Значение -1 создает зеркальное отражение по горизонтали */
    transform: scaleX(var(--sep-scale-x)) !important;
    }
    .sep-mod-flip-y {
    --sep-scale-y: -1 !important; /* Значение -1 создает зеркальное отражение по вертикали */
    transform: scaleY(var(--sep-scale-y)) !important;
    }
    .sep-mod-tilt-l { 
            --sep-rotate: -35deg !important;
            }
    .sep-mod-tilt-r {
            --sep-rotate: 35deg !important;
    }

    .sep-mod-cursed {
        filter: contrast(2.3) brightness(1.2) grayscale(0.5) hue-rotate(150deg) !important;
    }

    /* Анимации (используем фильтры или translate, чтобы не затирать transform) */
    .sep-mod-spin {
    animation: sep-anim-spin 2s linear infinite !important;
    }
    .sep-mod-bounce {
    animation: sep-anim-bounce 0.7s infinite alternate ease-in-out !important;
    }
    .sep-mod-jam {
    animation: sep-anim-jam 0.6s infinite !important;
    }
    .sep-mod-rainbow { 
    animation: sep-anim-rainbow 3s linear infinite !important;
    }
    .sep-mod-hyper { 
    animation: sep-anim-hyper 0.1s infinite !important; 
    }
    .sep-mod-party { 
    animation: sep-anim-party 0.6s infinite !important;
    }
    .sep-mod-slide { 
    animation: sep-anim-slide 1.5s infinite alternate ease-in-out !important; 
    }
    .sep-mod-arrive { 
    animation: sep-anim-arrive 0.8s forwards !important;
    }
    .sep-mod-leave { 
    animation: sep-anim-leave 0.8s forwards !important; 
    }

    @keyframes sep-anim-spin { 
    from { transform: scaleX(var(--sep-scale-x)) scaleY(var(--sep-scale-y)) rotate(0deg); 
    } to { 
        transform: scaleX(var(--sep-scale-x)) scaleY(var(--sep-scale-y)) rotate(360deg); 
        }
        }
    @keyframes sep-anim-bounce {
        from { margin-bottom: 0px; 
        } to { margin-bottom: 12px; } 
        }
    @keyframes sep-anim-jam {
        0%, 100% { --sep-rotate: -15deg;
        } 50% { --sep-rotate: 15deg; }
        }
    @keyframes sep-anim-rainbow {
        0% { filter: hue-rotate(0deg); 
        } 100% { filter: hue-rotate(360deg); }
        }
    @keyframes sep-anim-hyper { 
    0% { translate: 1px 1px; } 50% { translate: -1px -1px;
        } 100% { translate: 1px -1px; }
        }
    @keyframes sep-anim-party { 
    0% { filter: hue-rotate(0deg); scale: 1; 
    } 50% { filter: hue-rotate(180deg); scale: 1.2;
        } 100% { filter: hue-rotate(360deg); scale: 1; 
        } 
    }
    @keyframes sep-anim-slide { 
    from { translate: -8px 0; } to { translate: 8px 0; 
    } 
    }
    @keyframes sep-anim-arrive {
        from { opacity: 0; translate: -15px 0;
        } to { opacity: 1; translate: 0 0; 
        }
        }
    @keyframes sep-anim-leave {
        from { opacity: 1; translate: 0 0; 
        } to { opacity: 0; translate: 15px 0; 
        } 
    }
        `;
        document.head.appendChild(s);
    },

    isModifier(token) {
        return this.map.hasOwnProperty(token);
    },

    getModifierClass(token) {
        return this.map[token] || '';
    }
};

window.EmoteModifiers = EmoteModifiers;