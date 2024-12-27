/**
 * src/theme.js
 * 
 * Provides global color-randomization logic and immediate
 * application of the stored theme to avoid flicker.
 */ (function() {
    // 1) Immediately apply stored theme (avoid flash of default)
    const storedTheme = localStorage.getItem('themeVariables');
    if (storedTheme) {
        const themeVars = JSON.parse(storedTheme);
        for(const varName in themeVars)document.documentElement.style.setProperty(varName, themeVars[varName]);
    }
    // 2) Also check if we're stored as "monochrome" or not
    let isMonochrome = localStorage.getItem('isMonochrome') === 'true';
    // Provide utility functions in window scope
    window.ThemeManager = {
        // Generate a random color scheme
        generateColorScheme () {
            // Helper: HSL -> Hex
            function hslToHex(h, s, l) {
                l /= 100;
                const a = s * Math.min(l, 1 - l) / 100;
                const f = (n)=>{
                    const k = (n + h / 30) % 12;
                    const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
                    return Math.round(255 * color).toString(16).padStart(2, '0');
                };
                return `#${f(0)}${f(8)}${f(4)}`;
            }
            // Helper: get contrasting text color
            function getContrastingTextColor(bg) {
                const hex = bg.replace('#', '');
                const r = parseInt(hex.substr(0, 2), 16) / 255;
                const g = parseInt(hex.substr(2, 2), 16) / 255;
                const b = parseInt(hex.substr(4, 2), 16) / 255;
                const srgb = [
                    r,
                    g,
                    b
                ].map((c)=>c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
                const luminance = 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
                return luminance > 0.179 ? '#000000' : '#FFFFFF';
            }
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
        },
        // Apply a given scheme to :root
        applyColorScheme (scheme) {
            for(const varName in scheme)document.documentElement.style.setProperty(varName, scheme[varName]);
        },
        // Save current root variables to localStorage
        storeCurrentTheme () {
            const rootStyles = getComputedStyle(document.documentElement);
            const varList = [
                '--background-color',
                '--primary-color',
                '--secondary-color',
                '--accent-color',
                '--neutral-color',
                '--text-color'
            ];
            let themeVars = {};
            varList.forEach((v)=>{
                themeVars[v] = rootStyles.getPropertyValue(v).trim();
            });
            localStorage.setItem('themeVariables', JSON.stringify(themeVars));
        },
        // Apply monochrome scheme
        applyMonochrome () {
            const monoScheme = {
                '--background-color': '#f5f5f5',
                '--primary-color': '#4a4a4a',
                '--secondary-color': '#6e6e6e',
                '--accent-color': '#9e9e9e',
                '--text-color': '#1a1a1a',
                '--neutral-color': '#ffffff'
            };
            this.applyColorScheme(monoScheme);
        },
        // isMonochrome state
        isMonochrome: isMonochrome
    };
    // 3) Wait for DOM to attach a possible toggle button
    window.addEventListener('DOMContentLoaded', ()=>{
        const toggleBtn = document.querySelector('.theme-toggle');
        if (!toggleBtn) return; // If some pages have no toggle, do nothing
        // Initialize button text
        if (window.ThemeManager.isMonochrome) toggleBtn.textContent = 'Randomize Colours';
        else toggleBtn.textContent = 'Monochrome Mode';
        // Handle toggling
        toggleBtn.addEventListener('click', ()=>{
            if (window.ThemeManager.isMonochrome) {
                // Switch to random
                const newScheme = window.ThemeManager.generateColorScheme();
                window.ThemeManager.applyColorScheme(newScheme);
                window.ThemeManager.isMonochrome = false;
                toggleBtn.textContent = 'Monochrome Mode';
            } else {
                // Switch to mono
                window.ThemeManager.applyMonochrome();
                window.ThemeManager.isMonochrome = true;
                toggleBtn.textContent = 'Randomize Colours';
            }
            window.ThemeManager.storeCurrentTheme();
            localStorage.setItem('isMonochrome', window.ThemeManager.isMonochrome);
        });
    });
})();

//# sourceMappingURL=index.7a04dab6.js.map
