
function createVCF(phoneNumber) {
    // Count wildcards (dots or x)
    const wildcardCount = (phoneNumber.match(/[.x*% ]/gi) || []).length;
    if (wildcardCount === 0) {
        // Single contact
        return createSingleVCF(phoneNumber);
    } else if (wildcardCount > 2) {
        throw new Error('This range is too big for practical usage. Maximum 2 wildcards (dot or x) allowed.');
    } else {
        // Multiple numbers in one vCard
        return createMultiNumberVCF(phoneNumber, wildcardCount);
    }
}

// ...existing code...
function createSingleVCF(phoneNumber) {
    // Replace + with "pl" for the contact name
    var contactName = 'phone_' + phoneNumber.replace(/\+/g, 'pl');
    // Create VCF content following vCard 3.0 format
        var vcfContent = `BEGIN:VCARD
    VERSION:3.0
    FN:${contactName}
    N:${contactName};;;;
    TEL;TYPE=VOICE:${phoneNumber}
    END:VCARD`;
    return vcfContent;
}



function createMultiNumberVCF(phoneNumberPattern, wildcardCount) {
    const totalNumbers = Math.pow(10, wildcardCount);
    let telFields = [];
    let firstNumber = '';
    for (let i = 0; i < totalNumbers; i++) {
        const phoneNumber = generatePhoneNumber(phoneNumberPattern, i, wildcardCount);
        if (i === 0) firstNumber = phoneNumber;
        telFields.push('TEL;TYPE=VOICE:' + phoneNumber);
    }
    const contactName = 'phone_' + firstNumber.replace(/\+/g, 'pl');
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

function downloadVCF(phoneNumber, filename = null) {
    try {
        const vcfContent = createVCF(phoneNumber);
        const wildcardCount = (phoneNumber.match(/[.x]/gi) || []).length;
        let fileName;
        if (filename) {
            fileName = filename.endsWith('.vcf') ? filename : (filename + '.vcf');
        } else if (wildcardCount === 0) {
            const contactName = 'phone_' + phoneNumber.replace(/\+/g, 'pl');
            fileName = contactName + '.vcf';
        } else {
            const totalNumbers = Math.pow(10, wildcardCount);
            const patternName = phoneNumber.replace(/\+/g, 'pl').replace(/[.x]/gi, 'x');
            fileName = 'phone_range_' + patternName + '_' + totalNumbers + 'numbers.vcf';
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

let currentPhoneNumber = '';


function generatePreview() {
    const phoneInput = document.getElementById('phoneNumber');
    const phoneNumber = phoneInput.value.trim();
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
    const wildcardCount = (phoneNumber.match(/[.x]/gi) || []).length;
    if (wildcardCount > 2) {
        alert('This range is too big for practical usage. Maximum 2 wildcards (dot or x) allowed.');
        return;
    }
    currentPhoneNumber = phoneNumber;
    try {
        const vcfContent = createVCF(phoneNumber);
        // Show preview
        const preview = document.getElementById('preview');
        const contactInfo = document.getElementById('contactInfo');
        const vcfContentElement = document.getElementById('vcfContent');
        if (wildcardCount === 0) {
            // Single contact preview
            const contactName = 'phone_' + phoneNumber.replace(/\+/g, 'pl');
            contactInfo.innerHTML =
                '<div class="contact-info">' +
                    '<span><strong>Contact Name:</strong> ' + contactName + '</span>' +
                '</div>' +
                '<div class="contact-info">' +
                    '<span><strong>Phone Number:</strong> ' + phoneNumber + '</span>' +
                '</div>' +
                '<div class="contact-info">' +
                    '<span><strong>Total Numbers:</strong> 1</span>' +
                '</div>';
        } else {
            // Multiple numbers preview
            const totalNumbers = Math.pow(10, wildcardCount);
            const firstNumber = generatePhoneNumber(phoneNumber, 0, wildcardCount);
            const lastNumber = generatePhoneNumber(phoneNumber, totalNumbers - 1, wildcardCount);
            const firstContactName = 'phone_' + firstNumber.replace(/\+/g, 'pl');
            contactInfo.innerHTML =
                '<div class="contact-info">' +
                    '<span><strong>Pattern:</strong> ' + phoneNumber + '</span>' +
                '</div>' +
                '<div class="contact-info">' +
                    '<span><strong>Range:</strong> ' + firstNumber + ' - ' + lastNumber + '</span>' +
                '</div>' +
                '<div class="contact-info">' +
                    '<span><strong>Total Numbers:</strong> ' + totalNumbers + '</span>' +
                '</div>' +
                '<div class="contact-info">' +
                    '<span><strong>Example Contact Name:</strong> ' + firstContactName + '</span>' +
                '</div>';
        }
        vcfContentElement.textContent = vcfContent;
        preview.style.display = 'block';
        // Enable download button
        document.getElementById('downloadBtn').disabled = false;
    } catch (error) {
        alert(error.message);
    }
}

function downloadContact() {
    if (!currentPhoneNumber) {
        alert('Please generate a preview first');
        return;
    }
    var customFilename = document.getElementById('customFilename').value.trim();
    var filename = customFilename ? (customFilename + '.vcf') : null;
    downloadVCF(currentPhoneNumber, filename);
}

// Allow Enter key to generate preview
document.getElementById('phoneNumber').addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
        generatePreview();
    }
});

// Auto-generate preview when phone number changes
document.getElementById('phoneNumber').addEventListener('input', function() {
    const downloadBtn = document.getElementById('downloadBtn');
    if (this.value.trim() === '') {
        downloadBtn.disabled = true;
        document.getElementById('preview').style.display = 'none';
    }
});
