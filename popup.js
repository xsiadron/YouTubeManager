const STORAGE_KEY = 'yt-manager-slider-width';

document.addEventListener('DOMContentLoaded', initializePopup);

function initializePopup() {
    const slider = document.getElementById('width-slider');
    const label = document.getElementById('width-label');
    loadSliderValue(slider, label);
    slider.addEventListener('input', () => handleSliderInput(slider, label));
}

function loadSliderValue(slider, label) {
    chrome.storage.local.get([STORAGE_KEY], result => {
        const value = parseSliderValue(result[STORAGE_KEY]);
        slider.value = value;
        updateSliderUI(slider, label, value);
    });
}

function handleSliderInput(slider, label) {
    const value = parseSliderValue(slider.value);
    chrome.storage.local.set({ [STORAGE_KEY]: value }, () => {
        updateSliderUI(slider, label, value);
        notifyYouTubeTabs(value);
    });
}

function updateSliderUI(slider, label, value) {
    slider.style.width = '100%';
    slider.style.setProperty('--custom-slider-val', value + '%');
    label.textContent = value + '%';
}

function notifyYouTubeTabs(value) {
    chrome.tabs.query({ url: '*://www.youtube.com/*' }, tabs => {
        tabs.forEach(tab => {
            try {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateSliderWidth',
                    widthPercent: value
                }, () => {
                    if (chrome.runtime.lastError) {
                        // Ignore tabs without the content script
                    }
                });
            } catch (e) {
                // Ignore errors
            }
        });
    });
}

function parseSliderValue(val) {
    const num = parseInt(val, 10);
    return (!isNaN(num) && num >= 0 && num <= 100) ? num : 100;
}
