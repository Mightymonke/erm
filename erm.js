Game.registerMod("myAutobuy", {
    init: function () {

        const waitForGame = setInterval(() => {
            if (typeof Game !== "undefined" && Game.ready) {
                clearInterval(waitForGame);
                startAutobuyer();
            }
        }, 500);

        function startAutobuyer() {
            const loop = setInterval(() => {
                try {
                    const candidates = document.querySelectorAll('*');

                    candidates.forEach(el => {
                        if (!(el instanceof Element)) return;

                        const style = window.getComputedStyle(el);
                        if (!style) return;
                        const color = style.color;
                        if (color !== 'rgb(0, 255, 0)') return;

                        const productParent = el.closest('.product, .productUnlocked, .productLocked, .product');
                        const upgradeParent = el.closest('.upgrade, .upgrades, [id^="upgrade"]');
                        const anyParent = el.closest('[id^="product"], [id^="upgrade"], .product, .upgrade');

                        if (productParent || anyParent && anyParent.id && anyParent.id.startsWith('product')) {
                            const prodElem = productParent || document.getElementById(anyParent.id);
                            const idMatch = (prodElem && prodElem.id) ? prodElem.id.match(/product(\d+)/) : null;
                            if (idMatch) {
                                const idx = parseInt(idMatch[1], 10);
                                const obj = Game.ObjectsById[idx];
                                if (obj) {
                                    const price = (typeof obj.price === 'number') ? obj.price : (obj.getPrice ? obj.getPrice(1) : NaN);
                                    if (!isNaN(price) && Game.cookies >= price) {
                                        try {
                                            obj.buy(1);
                                        } catch (e) {
                                            try { prodElem.click(); } catch(e2){}
                                        }
                                    } else {
                                        try { prodElem.click(); } catch(e){}
                                    }
                                }
                            }
                        } else if (upgradeParent || anyParent && anyParent.id && anyParent.id.startsWith('upgrade')) {
                            const upElem = upgradeParent || document.getElementById(anyParent.id);
                            try {
                                upElem.click();
                            } catch (e) {}
                        } else {
                            const climb = el.closest('.product, .upgrade, [id^="product"], [id^="upgrade"]');
                            if (climb) {
                                try { climb.click(); } catch(e){}
                            }
                        }
                    });
                } catch (err) {}
            }, 1);

            window.myAutobuy_stop = () => { clearInterval(loop); };
        }
    }
});
