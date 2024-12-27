/* File: theme_handler.js */ /* =====================
   1) Immediately Load Theme from localStorage to prevent flashes
   ===================== */ (function() {
    const storedThemeVars = localStorage.getItem('themeVariables');
    if (storedThemeVars) {
        const themeVars = JSON.parse(storedThemeVars);
        for(const varName in themeVars)document.documentElement.style.setProperty(varName, themeVars[varName]);
    }
})();
/* =====================
     2) HSL -> Hex Conversion
     ===================== */ function hslToHex(h, s, l) {
    l /= 100;
    const a = s * Math.min(l, 1 - l) / 100;
    const f = (n)=>{
        const k = (n + h / 30) % 12;
        const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
        return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
}
/* =====================
     3) Contrast (for text color)
     ===================== */ function getContrastingTextColor(backgroundColor) {
    const hex = backgroundColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;
    const srgb = [
        r,
        g,
        b
    ].map((c)=>{
        return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
    return luminance > 0.179 ? '#000000' : '#FFFFFF';
}
/* =====================
     4) Generate a Color Scheme
     ===================== */ function generateColorScheme() {
    const harmonies = [
        'monochromatic',
        'analogous',
        'complementary',
        'triadic'
    ];
    const harmony = harmonies[Math.floor(Math.random() * harmonies.length)];
    const baseHue = Math.floor(Math.random() * 360);
    let hues = [];
    switch(harmony){
        case 'monochromatic':
            hues = [
                baseHue
            ];
            break;
        case 'analogous':
            hues = [
                baseHue,
                (baseHue + 30) % 360,
                (baseHue - 30 + 360) % 360
            ];
            break;
        case 'complementary':
            hues = [
                baseHue,
                (baseHue + 180) % 360
            ];
            break;
        case 'triadic':
            hues = [
                baseHue,
                (baseHue + 120) % 360,
                (baseHue + 240) % 360
            ];
            break;
    }
    const saturation = 40;
    const lightness = 75;
    const colors = hues.map((h)=>hslToHex(h, saturation, lightness));
    let scheme = {};
    if (harmony === 'monochromatic') scheme = {
        '--background-color': colors[0],
        '--primary-color': hslToHex(baseHue, saturation, lightness - 10),
        '--secondary-color': hslToHex(baseHue, saturation, lightness - 20),
        '--accent-color': hslToHex(baseHue, saturation, lightness - 5),
        '--neutral-color': hslToHex(baseHue, 30, 95)
    };
    else if (harmony === 'analogous') scheme = {
        '--background-color': colors[0],
        '--primary-color': colors[1],
        '--secondary-color': colors[2],
        '--accent-color': hslToHex(baseHue, saturation, lightness - 10),
        '--neutral-color': hslToHex(baseHue, 30, 95)
    };
    else if (harmony === 'complementary') scheme = {
        '--background-color': colors[0],
        '--primary-color': colors[1],
        '--secondary-color': hslToHex((baseHue + 90) % 360, 30, 85),
        '--accent-color': hslToHex((baseHue - 90 + 360) % 360, 30, 85),
        '--neutral-color': hslToHex(baseHue, 30, 95)
    };
    else if (harmony === 'triadic') scheme = {
        '--background-color': colors[0],
        '--primary-color': colors[1],
        '--secondary-color': colors[2],
        '--accent-color': hslToHex((baseHue + 60) % 360, 30, 85),
        '--neutral-color': hslToHex(baseHue, 30, 95)
    };
    scheme['--text-color'] = getContrastingTextColor(scheme['--background-color']);
    return scheme;
}
/* =====================
     5) Apply Color Scheme
     ===================== */ function applyColorScheme(scheme) {
    for(const varName in scheme)document.documentElement.style.setProperty(varName, scheme[varName]);
}
/* =====================
     6) Store Current Theme
     ===================== */ function storeCurrentThemeInLocalStorage() {
    let themeVars = {};
    const rootStyles = getComputedStyle(document.documentElement);
    const variables = [
        '--background-color',
        '--primary-color',
        '--secondary-color',
        '--accent-color',
        '--neutral-color',
        '--text-color'
    ];
    variables.forEach((varName)=>{
        themeVars[varName] = rootStyles.getPropertyValue(varName).trim();
    });
    localStorage.setItem('themeVariables', JSON.stringify(themeVars));
}
/* =====================
     7) Monochrome Scheme
     ===================== */ function applyMonochrome() {
    const monoScheme = {
        '--background-color': '#f5f5f5',
        '--primary-color': '#4a4a4a',
        '--secondary-color': '#6e6e6e',
        '--accent-color': '#9e9e9e',
        '--text-color': '#1a1a1a',
        '--neutral-color': '#ffffff'
    };
    applyColorScheme(monoScheme);
}
/* =====================
     8) Button Logic on DOM Load
     ===================== */ document.addEventListener('DOMContentLoaded', ()=>{
    // If we haven't stored "isMonochrome" yet, default to true
    let isMonochrome = localStorage.getItem('isMonochrome');
    if (isMonochrome === null) {
        isMonochrome = 'true';
        localStorage.setItem('isMonochrome', 'true');
    }
    // Convert to boolean
    isMonochrome = isMonochrome === 'true';
    // If we are currently in a "random" theme, set the button text accordingly
    const toggleButton = document.getElementById('theme-toggle');
    if (toggleButton) {
        if (isMonochrome) toggleButton.textContent = "Randomize Colours";
        else toggleButton.textContent = "Monochrome Mode";
        toggleButton.addEventListener('click', ()=>{
            if (isMonochrome) {
                // Switch to random scheme
                const newScheme = generateColorScheme();
                applyColorScheme(newScheme);
                toggleButton.textContent = "Monochrome Mode";
                isMonochrome = false;
                localStorage.setItem('isMonochrome', 'false');
            } else {
                // Switch back to monochrome
                applyMonochrome();
                toggleButton.textContent = "Randomize Colours";
                isMonochrome = true;
                localStorage.setItem('isMonochrome', 'true');
            }
            // Always store the new theme variables
            storeCurrentThemeInLocalStorage();
        });
    }
});

//# sourceMappingURL=index.9c6162f2.js.map
