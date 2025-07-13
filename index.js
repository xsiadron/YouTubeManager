(function () {
    const STEP = 0.01;
    const STORAGE_KEY = 'yt-manager-slider-width';
    const MIN_WIDTH_KEY = 'yt-manager-slider-min-width';
    const SLIDER_STYLE_KEY = 'yt-manager-slider-style';

    async function loadSliderWidth() {
        return new Promise((resolve) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get([STORAGE_KEY], (result) => {
                        if (chrome.runtime && chrome.runtime.lastError) {
                            resolve(100);
                            return;
                        }
                        let saved = result[STORAGE_KEY];
                        if (saved !== undefined && !isNaN(saved)) {
                            saved = parseInt(saved, 10);
                        } else {
                            saved = 100;
                        }
                        resolve((!isNaN(saved) && saved >= 0 && saved <= 100) ? saved : 100);
                    });
                } else {
                    let saved = localStorage.getItem(STORAGE_KEY);
                    if (saved !== null && !isNaN(saved)) {
                        saved = parseInt(saved, 10);
                    } else {
                        saved = 100;
                    }
                    resolve((!isNaN(saved) && saved >= 0 && saved <= 100) ? saved : 100);
                }
            } catch (e) {
                resolve(100);
            }
        });
    }

    async function loadSliderMinWidth() {
        return new Promise((resolve) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get([MIN_WIDTH_KEY], (result) => {
                        if (chrome.runtime && chrome.runtime.lastError) {
                            resolve(150);
                            return;
                        }
                        let saved = result[MIN_WIDTH_KEY];
                        if (saved !== undefined && !isNaN(saved)) {
                            saved = parseInt(saved, 10);
                        } else {
                            saved = 150;
                        }
                        resolve((!isNaN(saved) && saved >= 150 && saved <= 500) ? saved : 150);
                    });
                } else {
                    let saved = localStorage.getItem(MIN_WIDTH_KEY);
                    if (saved !== null && !isNaN(saved)) {
                        saved = parseInt(saved, 10);
                    } else {
                        saved = 150;
                    }
                    resolve((!isNaN(saved) && saved >= 150 && saved <= 500) ? saved : 150);
                }
            } catch (e) {
                resolve(150);
            }
        });
    }

    async function loadSliderThumbStyle() {
        return new Promise((resolve) => {
            try {
                if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
                    chrome.storage.local.get([SLIDER_STYLE_KEY], (result) => {
                        if (chrome.runtime && chrome.runtime.lastError) {
                            resolve('circle');
                            return;
                        }
                        resolve(result[SLIDER_STYLE_KEY] || 'circle');
                    });
                } else {
                    resolve('circle');
                }
            } catch (e) {
                resolve('circle');
            }
        });
    }

    if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
        try {
            chrome.runtime.onMessage.addListener((request) => {
                try {
                    if (request.action === 'updateSliderWidth' && typeof request.widthPercent === 'number') {
                        const area = document.querySelector('.ytp-volume-area');
                        if (area) area.style.width = `calc(${request.widthPercent}%)`;
                    }
                    if (request.action === 'updateSliderMinWidth' && typeof request.minWidthPx === 'number') {
                        const area = document.querySelector('.ytp-volume-area');
                        if (area) area.style.minWidth = request.minWidthPx + 'px';
                    }
                    if (request.action === 'updateSliderThumbStyle' && typeof request.sliderStyle === 'string') {
                        updateCustomSliderThumbStyle(request.sliderStyle);
                    }
                } catch (e) {
                    console.warn('onMessage handler error:', e);
                }
            });
        } catch (e) {
            console.warn('chrome.runtime.onMessage.addListener error:', e);
        }
    }

    function updateCustomSliderThumbStyle(style) {
        const slider = document.querySelector('#custom-volume-slider');
        if (!slider) return;
        slider.classList.remove('slider-thumb-circle', 'slider-thumb-line', 'slider-thumb-default');
        if (style === 'circle') slider.classList.add('slider-thumb-circle');
        else if (style === 'line') slider.classList.add('slider-thumb-line');
    }

    function isVolumeBarActive() {
        const area = document.querySelector('.ytp-volume-area');
        return area ? area.matches(':hover, :focus-within') : false;
    }

    function saveVolume(volume) {
        try {
            const ytObj = sessionStorage.getItem('yt-player-volume');
            let ytData = { volume: Math.round(volume * 100), muted: false };
            if (ytObj) {
                const parsed = JSON.parse(JSON.parse(ytObj).data);
                ytData = { ...parsed, volume: Math.round(volume * 100), muted: false };
            }
            const toStore = JSON.stringify({ data: JSON.stringify(ytData), creation: Date.now() });
            sessionStorage.setItem('yt-player-volume', toStore);
            localStorage.setItem('yt-player-volume', toStore);
        } catch (e) { console.warn(e); }
    }

    function saveVolumeStored(volume) {
        const percent = Math.max(1, Math.min(100, Math.round(volume * 100)));
        sessionStorage.setItem('yt-player-volume-saved', percent.toString());
    }

    function loadVolume() {
        try {
            const ytObj = sessionStorage.getItem('yt-player-volume');
            if (ytObj) {
                const parsed = JSON.parse(JSON.parse(ytObj).data);
                if (typeof parsed.volume === 'number') {
                    return Math.max(0, Math.min(1, parsed.volume / 100));
                }
            }
        } catch (e) { console.warn(e); }
        return null;
    }

    function loadVolumeStored() {
        try {
            const saved = sessionStorage.getItem('yt-player-volume-saved');
            if (saved !== null && !isNaN(Number(saved))) {
                return Math.max(0, Math.min(1, Number(saved) / 100));
            }
        } catch (e) { console.warn(e); }
        return null;
    }

    function onKeyDownCapture(e) {
        if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
            e.preventDefault();
            e.stopImmediatePropagation();
            return;
        }
        if ((e.key === 'ArrowLeft' || e.key === 'ArrowRight') && isVolumeBarActive()) {
            e.preventDefault();
            e.stopImmediatePropagation();
            changeVolume(e.key === 'ArrowRight' ? STEP : -STEP);
        }
    }
    document.addEventListener('keydown', onKeyDownCapture, { capture: true });

    let cachedElements = {
        slider: null,
        video: null,
        label: null,
        lastUpdate: 0
    };

    function getCachedElement(selector, cacheKey) {
        const now = Date.now();
        if (!cachedElements[cacheKey] || now - cachedElements.lastUpdate > 5000) {
            cachedElements[cacheKey] = document.querySelector(selector);
            cachedElements.lastUpdate = now;
        }
        return cachedElements[cacheKey];
    }

    function clearElementCache() {
        cachedElements = {
            slider: null,
            video: null,
            label: null,
            lastUpdate: 0
        };
    }

    let saveVolumeTimeout = null;
    function saveVolumeThrottled(volume) {
        if (saveVolumeTimeout) clearTimeout(saveVolumeTimeout);
        saveVolumeTimeout = setTimeout(() => {
            saveVolume(volume);
            saveVolumeStored(volume);
        }, 100);
    }

    function changeVolume(delta) {
        const video = getCachedElement('video', 'video');
        if (!video) return;
        const newVol = Math.min(1, Math.max(0, +(video.volume + delta).toFixed(2)));
        saveVolumeThrottled(newVol);
        applyVolume(newVol);
    }

    function applyVolume(volume) {
        const video = getCachedElement('video', 'video');
        if (!video) return;
        video.volume = volume;
        updateCustomSlider();
    }

    function setCustomSliderCSS(val) {
        const slider = getCachedElement('#custom-volume-slider', 'slider');
        if (slider) {
            slider.style.setProperty('--custom-slider-val', `${val * 100}%`);
        }
    }

    function updateCustomSlider() {
        const slider = getCachedElement('#custom-volume-slider', 'slider');
        const video = getCachedElement('video', 'video');
        if (slider && video) {
            slider.value = video.volume;
            setCustomSliderCSS(video.volume);
            const label = getCachedElement('#custom-volume-label', 'label');
            if (label) {
                label.textContent = Math.round(video.volume * 100) + '%';
            }
        }
    }

    async function injectCustomVolumeSlider() {
        document.querySelector('#custom-volume-wrapper')?.remove();
        const area = document.querySelector('.ytp-volume-area');
        if (!area) return;
        const widthPercent = await loadSliderWidth();
        const minWidthPx = await loadSliderMinWidth();
        const sliderStyle = await loadSliderThumbStyle();
        area.style.width = `calc(${widthPercent}%)`;
        area.style.minWidth = minWidthPx + 'px';
        const wrapper = document.createElement('div');
        wrapper.id = 'custom-volume-wrapper';
        wrapper.style.display = 'flex';
        wrapper.style.alignItems = 'center';
        wrapper.style.width = '100%';
        wrapper.style.minWidth = '100px';
        wrapper.style.padding = '6px 0';
        wrapper.style.cursor = 'pointer';
        wrapper.style.position = 'relative';
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = 'custom-volume-slider';
        slider.min = 0;
        slider.max = 1;
        slider.step = 0.01;
        slider.style.width = '100%';
        slider.style.marginRight = '6px';
        slider.classList.remove('slider-thumb-circle', 'slider-thumb-line', 'slider-thumb-default');
        if (sliderStyle === 'circle') slider.classList.add('slider-thumb-circle');
        else if (sliderStyle === 'line') slider.classList.add('slider-thumb-line');
        const label = document.createElement('div');
        label.id = 'custom-volume-label';
        label.style.color = 'white';
        label.style.fontSize = '12px';
        label.style.width = '30px';
        label.style.minWidth = '30px';
        label.style.textAlign = 'right';
        wrapper.appendChild(slider);
        wrapper.appendChild(label);
        area.appendChild(wrapper);

        let isDragging = false;

        const handleVolumeChange = (e) => {
            const sliderRect = slider.getBoundingClientRect();
            const clickX = e.clientX - sliderRect.left;
            const sliderWidth = sliderRect.width;
            const newValue = Math.max(0, Math.min(1, clickX / sliderWidth));

            wrapper.isCustomChange = true;
            slider.value = newValue;
            setCustomSliderCSS(newValue);

            const video = getCachedElement('video', 'video');
            if (video) {
                video.volume = newValue;
            }

            const label = getCachedElement('#custom-volume-label', 'label');
            if (label) {
                label.textContent = Math.round(newValue * 100) + '%';
            }

            setTimeout(() => { wrapper.isCustomChange = false; }, 10);
        };

        wrapper.addEventListener('mousedown', (e) => {
            if (e.target === wrapper || e.target === label) {
                isDragging = true;
                wrapper.isDragging = true;
                handleVolumeChange(e);
                e.preventDefault();
            }
        });

        wrapper.addEventListener('mousemove', (e) => {
            if (isDragging) {
                handleVolumeChange(e);
                e.preventDefault();
            }
        });

        wrapper.addEventListener('mouseup', (e) => {
            if (isDragging) {
                isDragging = false;
                wrapper.isDragging = false;
                const vol = parseFloat(slider.value);
                saveVolumeThrottled(vol);
            }
        });

        wrapper.addEventListener('mouseleave', (e) => {
            if (isDragging) {
                isDragging = false;
                wrapper.isDragging = false;
                const vol = parseFloat(slider.value);
                saveVolumeThrottled(vol);
            }
        });
        const muteBtn = document.querySelector('.ytp-mute-button');
        if (muteBtn) {
            muteBtn.addEventListener('click', () => {
                const stored = loadVolumeStored();
                if (stored !== null) {
                    slider.value = stored;
                    applyVolume(stored);
                    saveVolume(stored);
                }
            });
        }
        const video = document.querySelector('video');
        if (video) {
            slider.value = video.volume;
            setCustomSliderCSS(video.volume);
            label.textContent = Math.round(video.volume * 100) + '%';
            slider.addEventListener('input', () => {
                const vol = parseFloat(slider.value);
                setCustomSliderCSS(vol);
                saveVolumeThrottled(vol);
                applyVolume(vol);
            });
            const val = (slider.value - slider.min) / (slider.max - slider.min);
            slider.style.background = `linear-gradient(to right, #ffffff 0%, #ffffff ${val * 100}%, #333333 ${val * 100}%, #333333 100%)`;
            video.removeEventListener('volumechange', updateCustomSlider);
            video.addEventListener('volumechange', updateCustomSlider);
        }
    }

    function hideDefaultVolumeUI() {
        const style = document.createElement('style');
        style.id = 'custom-volume-hide-style';
        style.textContent = `
            .ytp-time-display.notranslate {
                margin-left: 40px;
            }
            .ytp-volume-panel, .ytp-volume-slider, .ytp-volume-slider-handle { display: none !important; }
            .ytp-mute-button { min-width: 48px !important; }
            #custom-volume-slider {
                -webkit-appearance: none !important;
                -moz-appearance: none !important;
                appearance: none !important;
                flex: 1;
                margin-right: 8px;
                width: 100%;
                min-width: 100px;
                transition: width 0.2s ease;
                --custom-slider-val: 100%;
                vertical-align: middle;
            }
            #custom-volume-slider:focus { outline: none; }
            #custom-volume-slider::-webkit-slider-runnable-track {
                background: linear-gradient(to right, #ffffff 0%, #ffffff var(--custom-slider-val, 50%), #333333 var(--custom-slider-val, 50%), #333333 100%) !important;
                height: 4px;
                border-radius: 2px;
                position: relative;
            }
            #custom-volume-slider::-webkit-slider-thumb {
                -webkit-appearance: none !important;
                background-color: #fff !important;
            }
            #custom-volume-slider.slider-thumb-circle::-webkit-slider-thumb {
                border-radius: 50% !important;
                margin-top: -6px !important;
                border: none !important;
                width: 16px !important;
                height: 16px !important;
            }
            #custom-volume-slider.slider-thumb-line::-webkit-slider-thumb {
                border-radius: 2px !important;
                margin-top: -9px !important;
                border: none !important;
                width: 4px !important;
                height: 22px !important;
                box-shadow: none !important;
            }
            #custom-volume-slider::-moz-range-track {
                background: linear-gradient(to right, #ffffff 0%, #ffffff var(--custom-slider-val, 50%), #333333 var(--custom-slider-val, 50%), #333333 100%) !important;
                height: 4px;
                border-radius: 2px;
            }
            #custom-volume-slider.slider-thumb-circle::-moz-range-thumb {
                background-color: #fff !important;
                border-radius: 50% !important;
                border: none !important;
                width: 16px !important;
                height: 16px !important;
            }
            #custom-volume-slider.slider-thumb-line::-moz-range-thumb {
                background-color: #fff !important;
                border-radius: 2px !important;
                border: none !important;
                width: 4px !important;
                height: 22px !important;
            }
            #custom-volume-slider::-ms-fill-lower { background: #ffffff !important; }
            #custom-volume-slider::-ms-fill-upper { background: #333333 !important; }
            #custom-volume-slider.slider-thumb-circle::-ms-thumb {
                background-color: #fff !important;
                border-radius: 50% !important;
                border: none !important;
                width: 16px !important;
                height: 16px !important;
            }
            #custom-volume-slider.slider-thumb-line::-ms-thumb {
                background-color: #fff !important;
                border-radius: 2px !important;
                border: none !important;
                width: 4px !important;
                height: 22px !important;
            }
            #custom-volume-slider { --custom-slider-val: 100%; }
            .ytp-chapter-container {
                max-width: fit-content !important;
            }
        `;
        document.head.appendChild(style);
    }

    function fixMouseVolumeDrag() {
        const range = document.querySelector('.ytp-volume-slider input[type="range"]');
        if (range) {
            range.addEventListener('input', () => {
                const video = document.querySelector('video');
                if (!video) return;
                video.volume = Math.round(video.volume * 100) / 100;
                saveVolume(video.volume);
            });
        }
    }

    let volumeCheckInterval = null;

    function startVolumeMonitoring() {
        if (volumeCheckInterval) return;

        volumeCheckInterval = setInterval(() => {
            if (document.hidden) return;

            const video = getCachedElement('video', 'video');
            if (!video) {
                clearElementCache();
                return;
            }

            forceVolumeFromSaved();
        }, 30000);
    }

    function stopVolumeMonitoring() {
        if (volumeCheckInterval) {
            clearInterval(volumeCheckInterval);
            volumeCheckInterval = null;
        }
    }

    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            stopVolumeMonitoring();
        } else {
            startVolumeMonitoring();
        }
    });

    function forceVolumeFromSaved() {
        const stored = loadVolumeStored();
        if (stored !== null) {
            const video = getCachedElement('video', 'video');
            if (video) {
                video.volume = stored;
                video.dispatchEvent(new Event('volumechange'));
            }
            const slider = getCachedElement('#custom-volume-slider', 'slider');
            if (slider) slider.value = stored;
            const label = getCachedElement('#custom-volume-label', 'label');
            if (label) label.textContent = Math.round(stored * 100) + '%';
            const range = document.querySelector('.ytp-volume-slider input[type="range"]');
            if (range) range.value = stored;
        }
    }
    startVolumeMonitoring();

    function enforceSavedVolumeOnChange() {
        const video = getCachedElement('video', 'video');
        if (video) {
            video.addEventListener('volumechange', () => {
                const wrapper = document.querySelector('#custom-volume-wrapper');
                if (wrapper && (wrapper.isCustomChange || wrapper.isDragging)) {
                    return;
                }

                const stored = loadVolumeStored();
                if (stored !== null && Math.abs(video.volume - stored) > 0.01) {
                    video.volume = stored;
                    const slider = getCachedElement('#custom-volume-slider', 'slider');
                    if (slider) slider.value = stored;
                    const label = getCachedElement('#custom-volume-label', 'label');
                    if (label) label.textContent = Math.round(stored * 100) + '%';
                    const range = document.querySelector('.ytp-volume-slider input[type="range"]');
                    if (range) range.value = stored;
                }
            });
        }
    }

    async function init() {
        clearElementCache();

        hideDefaultVolumeUI();
        await injectCustomVolumeSlider();
        fixMouseVolumeDrag();
        enforceSavedVolumeOnChange();

        const saved = loadVolume();
        if (saved !== null) {
            const player = document.querySelector('#movie_player');
            if (player && typeof player.setVolume === 'function') {
                player.setVolume(Math.round(saved * 100));
            }
            applyVolume(saved);
        }
    }

    let initTimeout = null;
    window.addEventListener('yt-navigate-finish', () => {
        if (initTimeout) clearTimeout(initTimeout);
        initTimeout = setTimeout(init, 300);
    });

    init();
})();
