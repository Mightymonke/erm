Game.registerMod("myAutobuy", {
    init: function () {
        console.log("%cmyAutobuy: loaded (waiting for Game.ready)...", "color: lightgreen");

        // Wait until the game is ready
        const waitForGame = setInterval(() => {
            if (typeof Game !== "undefined" && Game.ready) {
                clearInterval(waitForGame);
                console.log("%cmyAutobuy: Game.ready, starting autobuyer", "color: lightgreen");
                startAutobuyer();
            }
        }, 500);

        function startAutobuyer() {
            // Main loop
            const loop = setInterval(() => {
                try {
                    // Query any element that *might* show price / highlight text
                    // This is intentionally broad; we then climb the DOM to a clickable parent.
                    const candidates = document.querySelectorAll('*');

                    candidates.forEach(el => {
                        // skip text nodes etc
                        if (!(el instanceof Element)) return;

                        // only check elements with text content length < 100 to avoid heavy ones — optional optimization
                        // get computed color
                        const style = window.getComputedStyle(el);
                        if (!style) return;
                        const color = style.color;
                        if (color !== 'rgb(0, 255, 0)') return; // only bright green

                        // We found a green element — find the clickable parent
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
                                    // check affordability quickly
                                    const price = (typeof obj.price === 'number') ? obj.price : (obj.getPrice ? obj.getPrice(1) : NaN);
                                    if (!isNaN(price) && Game.cookies >= price) {
                                        try {
                                            obj.buy(1);
                                            console.log(`myAutobuy: bought product ${idx} (price ${Math.round(price)})`);
                                        } catch (e) {
                                            // fallback to DOM click
                                            try { prodElem.click(); console.log(`myAutobuy: fallback click product ${idx}`); } catch(e2){console.warn("myAutobuy: click fallback failed", e2);}
                                        }
                                    } else {
                                        // affordable check failed — still try click (some builds rely on click)
                                        try { prodElem.click(); console.log(`myAutobuy: clicked product ${idx} (maybe queued)`); } catch(e){}
                                    }
                                }
                            }
                        } else if (upgradeParent || anyParent && anyParent.id && anyParent.id.startsWith('upgrade')) {
                            const upElem = upgradeParent || document.getElementById(anyParent.id);
                            // Try to find Upgrade object by matching tooltip or title — else click DOM
                            // Safer to click the element because Game.UpgradesById indexing is less consistent across modded games
                            try {
                                upElem.click();
                                console.log('myAutobuy: clicked upgrade element', upElem.id || upElem);
                            } catch (e) {
                                console.warn('myAutobuy: failed clicking upgrade element', e);
                            }
                        } else {
                            // If it's green but not product/upgrade, climb a few levels to find a product/upgrade
                            const climb = el.closest('.product, .upgrade, [id^="product"], [id^="upgrade"]');
                            if (climb) {
                                try {
                                    climb.click();
                                    console.log('myAutobuy: clicked climb parent', climb.id || climb.className);
                                } catch(e){}
                            } else {
                                // debug: found green element that isn't recognized
                                // console.debug('myAutobuy: green element not matching product/upgrade', el);
                            }
                        }
                    });
                } catch (err) {
                    console.error("myAutobuy: loop error", err);
                }
            }, 300);

            // Expose a stop function for debugging (in console: myAutobuy_stop())
            window.myAutobuy_stop = () => { clearInterval(loop); console.log("myAutobuy: stopped"); };
        }
    }
});
