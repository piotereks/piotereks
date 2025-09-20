// --- UI/DOM logic from vcf_gen.html moved here ---
document.addEventListener('DOMContentLoaded', function() {
    // Theme override logic
    function getThemeParam() {
        const params = new URLSearchParams(window.location.search);
        for (const key of params.keys()) {
            const val = key.toLowerCase();
            if (val === 'd' || val === 'dark') return 'dark';
            if (val === 'l' || val === 'light') return 'light';
        }
        for (const [key, value] of params.entries()) {
            const val = value.toLowerCase();
            if (val === 'd' || val === 'dark') return 'dark';
            if (val === 'l' || val === 'light') return 'light';
        }
        return null;
    }
    const theme = getThemeParam();
    if (theme === 'dark') {
        document.body.classList.add('theme-dark');
        document.body.classList.remove('theme-light');
    } else if (theme === 'light') {
        document.body.classList.add('theme-light');
        document.body.classList.remove('theme-dark');
    }

    // Patch: get custom name from input
    window.getCustomContactName = function() {
        var val = document.getElementById('customName');
        return val && val.value.trim() ? val.value.trim() : null;
    };
    // Patch: always enable download button
    var downloadBtn = document.getElementById('downloadBtn');
    if (downloadBtn) downloadBtn.disabled = false;
    // Patch: allow downloadContact to work without preview
    window.downloadContact = function() {
        var phoneInput = document.getElementById('phoneNumber');
        var phoneNumber = phoneInput.value.trim();
        if (!phoneNumber) {
            alert('Please enter a phone number');
            return;
        }
        var customName = window.getCustomContactName();
        window.downloadVCF(phoneNumber, null, customName);
    };
    // Patch: pass custom name to preview logic
    if (window.generatePreview) {
        var origGeneratePreview = window.generatePreview;
        window.generatePreview = function() {
            window._customContactName = window.getCustomContactName();
            origGeneratePreview();
        };
    }
});

function createVCF(phoneNumber, customName) {
    // Count wildcards (dots, x, *, %)
    const wildcardCount = (phoneNumber.match(/[.x*%]/gi) || []).length;
        if (wildcardCount > 2) {
            throw new Error('This range is too big for practical usage. Maximum 2 wildcards (., x, *, %) allowed.');
        }
        const today = new Date();
        const y = today.getFullYear().toString().slice(-2);
        const m = (today.getMonth() + 1).toString().padStart(2, '0');
        const d = today.getDate().toString().padStart(2, '0');
        const dateStr = y + m + d;
        const contactName = customName && customName.length > 0
            ? customName
            : dateStr + '_' + 'spam_' + phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');

    let telFields = [];
    if (wildcardCount === 0) {
        telFields.push('TEL;TYPE=VOICE:' + phoneNumber);
    } else {
        // Multiple numbers in one vCard
        const totalNumbers = Math.pow(10, wildcardCount);
        for (let i = 0; i < totalNumbers; i++) {
            const num = generatePhoneNumber(phoneNumber, i, wildcardCount);
            telFields.push('TEL;TYPE=VOICE:' + num);
        }
    }
    return [
        'BEGIN:VCARD',
        'VERSION:3.0',
        'FN:' + contactName,
        'N:' + contactName + ';;;;',
        ...telFields,
        'END:VCARD'
    ].join('\n');
}
        


function generatePhoneNumber(pattern, number, wildcardCount) {
    // Convert number to string with leading zeros
    const digits = number.toString().padStart(wildcardCount, '0');
    let result = pattern;
    let digitIndex = 0;
    // Replace each dot or x (case-insensitive) with corresponding digit
    for (let i = 0; i < result.length; i++) {
        if (result[i] === '.' || result[i].toLowerCase() === 'x') {
            result = result.substring(0, i) + digits[digitIndex] + result.substring(i + 1);
            digitIndex++;
        }
    }
    return result;
}

// Function to download VCF file (browser environment)


function downloadVCF(phoneNumber, filename = null, customName = null) {
    try {
        const vcfContent = createVCF(phoneNumber, customName);
        const wildcardCount = (phoneNumber.match(/[.x*%]/gi) || []).length;
        let fileName;
        if (filename) {
            fileName = filename.endsWith('.vcf') ? filename : (filename + '.vcf');
        } else if (customName && customName.length > 0) {
            fileName = customName.replace(/\s+/g, '_') + '.vcf';
        } else if (wildcardCount === 0) {
            const contactName = 'spam_' + phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');
            fileName = contactName + '.vcf';
        } else {
            const totalNumbers = Math.pow(10, wildcardCount);
            const patternName = phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');
            fileName = 'spam_' + patternName + '_' + totalNumbers + 'numbers.vcf';
        }
        const blob = new Blob([vcfContent], { type: 'text/vcard;charset=utf-8' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = fileName;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    } catch (error) {
        alert(error.message);
    }
}


function generatePreview() {
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput.value.trim();
    const customName = (typeof window._customContactName !== 'undefined') ? window._customContactName : (window.getCustomContactName ? window.getCustomContactName() : null);
    if (!phoneNumber) {
        alert('Please enter a phone number');
        return;
    }
    // Only allow +, digits, *, %, ., x, w, p
    if (!/^[+0-9*%.xwp]+$/i.test(phoneNumber)) {
        alert('Phone number can only contain: +, digits, *, %, dot, x, w, p');
        return;
    }
    // Check for wildcards
    const wildcardCount = (phoneNumber.match(/[.x*%]/gi) || []).length;
    if (wildcardCount > 2) {
        alert('This range is too big for practical usage. Maximum 2 wildcards (., x, *, %) allowed.');
        return;
    }
    try {
        const vcfContent = createVCF(phoneNumber, customName);
        // Show preview
        const preview = document.getElementById('preview');
        const contactInfo = document.getElementById('contactInfo');
        const vcfContentElement = document.getElementById('vcfContent');
        
        if (wildcardCount === 0) {
            // Single contact preview
            const contactName = customName && customName.length > 0
                ? customName
                : 'spam_' + phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');
            contactInfo.innerHTML =
                '<div class="contact-info">' +
                    '<span><strong>Contact Name:</strong> ' + contactName + '</span>' +
                '</div>' +
                '<div class="contact-info">' +
                        '<span><strong>\u260E\ufe0f #</strong> ' + phoneNumber + '</span>' +
                '</div>';
        } else {
            // Multiple numbers preview
            const totalNumbers = Math.pow(10, wildcardCount);
            const firstNumber = generatePhoneNumber(phoneNumber, 0, wildcardCount);
            const lastNumber = generatePhoneNumber(phoneNumber, totalNumbers - 1, wildcardCount);
            const contactName = customName && customName.length > 0
                ? customName
                : 'spam_' + phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');

            // Create pattern with underscored wildcards
            let patternDisplay = '';
            for (let i = 0; i < phoneNumber.length; i++) {
                if (/[.x*%]/i.test(phoneNumber[i])) {
                    patternDisplay += '<u>' + phoneNumber[i] + '</u>';
                } else {
                    patternDisplay += phoneNumber[i];
                }
            }

            // Create range numbers with underscored wildcards
            let firstNumberDisplay = '';
            let lastNumberDisplay = '';
            for (let i = 0; i < phoneNumber.length; i++) {
                if (/[.x*%]/i.test(phoneNumber[i])) {
                    firstNumberDisplay += '<u>' + firstNumber[i] + '</u>';
                    lastNumberDisplay += '<u>' + lastNumber[i] + '</u>';
                } else {
                    firstNumberDisplay += firstNumber[i];
                    lastNumberDisplay += lastNumber[i];
                }
            }

            contactInfo.innerHTML =
                '<div class="contact-info">' +
                    '<span><strong>Pattern:</strong> ' + patternDisplay + '</span>' +
                '</div>' +
                '<div class="contact-info">' +
                        '<span><strong>\u260E\ufe0f #</strong> (' + firstNumberDisplay + ') - (' + lastNumberDisplay + ') ' + totalNumbers + ' numbers</span>' +
                '</div>' +
                '<div class="contact-info">' +
                    '<span><strong>Contact Name:</strong> ' + contactName + '</span>' +
                '</div>';

            vcfContentElement.textContent = vcfContent;
            preview.style.display = 'block';
            // Enable download button
            document.getElementById('downloadBtn').disabled = false;
        }
        vcfContentElement.textContent = vcfContent;
        preview.style.display = 'block';
        // Enable download button
        document.getElementById('downloadBtn').disabled = false;
    } catch (error) {
        alert(error.message);
    }
}


// downloadContact is now patched in vcf_gen.html to allow download without preview and use custom name

// Allow Enter key to generate preview

document.getElementById('phoneNumber').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        generatePreview();
    }
});

document.getElementById('phoneNumber').addEventListener('input', function() {
    const downloadBtn = document.getElementById('downloadBtn');
    if (this.value.trim() === '') {
        downloadBtn.disabled = true;
        document.getElementById('preview').style.display = 'none';
    }
});
}
