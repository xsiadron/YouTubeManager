const STORAGE_KEY = 'yt-manager-slider-width';
const MIN_WIDTH_KEY = 'yt-manager-slider-min-width';

document.addEventListener('DOMContentLoaded', initializePopup);

function initializePopup() {
    const slider = document.getElementById('width-slider');
    const label = document.getElementById('width-label');
    const minWidthInput = document.getElementById('min-width-input');
    loadSliderValue(slider, label);
    loadMinWidthValue(minWidthInput);
    slider.addEventListener('input', () => handleSliderInput(slider, label));
    minWidthInput.addEventListener('input', () => handleMinWidthInput(minWidthInput));
}

function loadSliderValue(slider, label) {
    chrome.storage.local.get([STORAGE_KEY], result => {
        const value = parseSliderValue(result[STORAGE_KEY]);
        slider.value = value;
        updateSliderUI(slider, label, value);
    });
}

function loadMinWidthValue(input) {
    chrome.storage.local.get([MIN_WIDTH_KEY], result => {
        const value = parseMinWidthValue(result[MIN_WIDTH_KEY]);
        input.value = value;
    });
}

function handleSliderInput(slider, label) {
    const value = parseSliderValue(slider.value);
    chrome.storage.local.set({ [STORAGE_KEY]: value }, () => {
        updateSliderUI(slider, label, value);
        notifyYouTubeTabs(value);
    });
}

function handleMinWidthInput(input) {
    const value = parseMinWidthValue(input.value);
    chrome.storage.local.set({ [MIN_WIDTH_KEY]: value }, () => {
        notifyYouTubeTabsMinWidth(value);
    });
}

function updateSliderUI(slider, label, value) {
    slider.style.width = '100%';
    const percent = ((value - 10) / 90) * 100;
    slider.style.setProperty('--custom-slider-val', percent + '%');
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

function notifyYouTubeTabsMinWidth(value) {
    chrome.tabs.query({ url: '*://www.youtube.com/*' }, tabs => {
        tabs.forEach(tab => {
            try {
                chrome.tabs.sendMessage(tab.id, {
                    action: 'updateSliderMinWidth',
                    minWidthPx: value
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

function parseMinWidthValue(val) {
    const num = parseInt(val, 10);
    return (!isNaN(num) && num >= 50 && num <= 500) ? num : 150;
}
