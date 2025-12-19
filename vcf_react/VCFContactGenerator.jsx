import React, { useState } from 'react';
import favicon from './favicon.svg';

function countWildcards(phoneNumber) {
  return (phoneNumber.match(/[.x*%]/gi) || []).length;
}

function generatePhoneNumber(pattern, number, wildcardCount) {
  const digits = number.toString().padStart(wildcardCount, '0');
  let result = pattern;
  let digitIndex = 0;
  for (let i = 0; i < result.length; i++) {
    if (result[i] === '.' || result[i].toLowerCase() === 'x' || result[i] === '*' || result[i] === '%') {
      result = result.substring(0, i) + digits[digitIndex] + result.substring(i + 1);
      digitIndex++;
    }
  }
  return result;
}

function createSingleVCF(phoneNumber, customName) {
  let contactName = customName && customName.length > 0
    ? customName
    : 'spame_' + phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');
  return `BEGIN:VCARD\nVERSION:3.0\nFN:${contactName}\nN:${contactName};;;;\nTEL;TYPE=VOICE:${phoneNumber}\nEND:VCARD`;
}

function createMultiNumberVCF(phoneNumberPattern, wildcardCount, customName) {
  const totalNumbers = Math.pow(10, wildcardCount);
  let telFields = [];
  for (let i = 0; i < totalNumbers; i++) {
    const phoneNumber = generatePhoneNumber(phoneNumberPattern, i, wildcardCount);
    telFields.push('TEL;TYPE=VOICE:' + phoneNumber);
  }
  const contactName = customName && customName.length > 0
    ? customName
    : 'spam_' + phoneNumberPattern.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');
  return [
    'BEGIN:VCARD',
    'VERSION:3.0',
    'FN:' + contactName,
    'N:' + contactName + ';;;;',
    ...telFields,
    'END:VCARD'
  ].join('\n');
}

function createVCF(phoneNumber, customName) {
  const wildcardCount = countWildcards(phoneNumber);
  if (wildcardCount === 0) {
    return createSingleVCF(phoneNumber, customName);
  } else if (wildcardCount > 2) {
    throw new Error('This range is too big for practical usage. Maximum 2 wildcards (., x, *, %) allowed.');
  } else {
    return createMultiNumberVCF(phoneNumber, wildcardCount, customName);
  }
}

function downloadVCF(phoneNumber, customName) {
  try {
    const vcfContent = createVCF(phoneNumber, customName);
    const wildcardCount = countWildcards(phoneNumber);
    let fileName;
    if (customName && customName.length > 0) {
      fileName = customName.replace(/\s+/g, '_') + '.vcf';
    } else if (wildcardCount === 0) {
      const contactName = 'spam_' + phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');
      fileName = contactName + '.vcf';
    } else {
      const totalNumbers = Math.pow(10, wildcardCount);
      const patternName = phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');
      fileName = 'spam_range_' + patternName + '_' + totalNumbers + 'numbers.vcf';
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

const VCFContactGenerator = () => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [customName, setCustomName] = useState('');
  const [vcfContent, setVcfContent] = useState('');
  const [contactInfo, setContactInfo] = useState(null);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = (e) => {
    e.preventDefault();
    if (!phoneNumber.trim()) {
      alert('Please enter a phone number');
      return;
    }
    if (!/^[+0-9*%.xwp]+$/i.test(phoneNumber)) {
      alert('Phone number can only contain: +, digits, *, %, dot, x, w, p');
      return;
    }
    const wildcardCount = countWildcards(phoneNumber);
    if (wildcardCount > 2) {
      alert('This range is too big for practical usage. Maximum 2 wildcards (., x, *, %) allowed.');
      return;
    }
    try {
      const vcf = createVCF(phoneNumber, customName);
      setVcfContent(vcf);
      setShowPreview(true);
      // Info
      if (wildcardCount === 0) {
        const contactName = customName && customName.length > 0
          ? customName
          : 'spam_' + phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');
        setContactInfo([
          <div className="contact-info" key="name"><strong>Contact Name:</strong> {contactName}</div>,
          <div className="contact-info" key="phone"><strong>☎️</strong> {phoneNumber}</div>
        ]);
      } else {
        const totalNumbers = Math.pow(10, wildcardCount);
        const firstNumber = generatePhoneNumber(phoneNumber, 0, wildcardCount);
        const lastNumber = generatePhoneNumber(phoneNumber, totalNumbers - 1, wildcardCount);
        const contactName = customName && customName.length > 0
          ? customName
          : 'spam_' + phoneNumber.replace(/\+/g, 'pl').replace(/[.x*%]/gi, 'x');
        // Pattern display
        let patternDisplay = '';
        for (let i = 0; i < phoneNumber.length; i++) {
          if (/[.x*%]/i.test(phoneNumber[i])) {
            patternDisplay += <u key={i}>{phoneNumber[i]}</u>;
          } else {
            patternDisplay += phoneNumber[i];
          }
        }
        // Range display
        let firstNumberDisplay = '';
        let lastNumberDisplay = '';
        for (let i = 0; i < phoneNumber.length; i++) {
          if (/[.x*%]/i.test(phoneNumber[i])) {
            firstNumberDisplay += <u key={i}>{firstNumber[i]}</u>;
            lastNumberDisplay += <u key={i}>{lastNumber[i]}</u>;
          } else {
            firstNumberDisplay += firstNumber[i];
            lastNumberDisplay += lastNumber[i];
          }
        }
        setContactInfo([
          <div className="contact-info" key="pattern"><strong>Pattern:</strong> {patternDisplay}</div>,
          <div className="contact-info" key="range"><strong>☎️</strong> ({firstNumberDisplay}) - ({lastNumberDisplay}) {totalNumbers} numbers</div>,
          <div className="contact-info" key="name"><strong>Contact Name:</strong> {contactName}</div>
        ]);
      }
    } catch (error) {
      alert(error.message);
    }
  };

  const handleDownload = () => {
    downloadVCF(phoneNumber, customName);
  };

  return (
    <div className="container py-4 my-5">
      <h1 className="mb-4">
        <img src={favicon} alt="favicon" style={{ height: '1.6em', verticalAlign: 'middle', marginRight: '0.4em' }} />
        VCF Contact Generator
      </h1>
      <form onSubmit={handlePreview}>
        <div className="mb-3">
          <label htmlFor="phoneNumber" className="form-label">Phone Number:</label>
          <input type="tel" className="form-control" id="phoneNumber" value={phoneNumber} onChange={e => setPhoneNumber(e.target.value)} placeholder="e.g., +48123456789 or +4912345678. (dot = any digit)" autoComplete="tel" />
          <small className="form-text help-text">
            Allowed: <b>+</b>, digits, <b>*</b>, <b>%</b>, <b>.</b>, <b>x</b>, <b>w</b>, <b>p</b>.<br />
            Use <b>.</b>, <b>x</b>, <b>*</b>, or <b>%</b> as wildcards (each stands for any digit):<br />
            1 wildcard = 10 numbers, 2 wildcards = 100 numbers
          </small>
        </div>
        <div className="mb-3">
          <label htmlFor="customName" className="form-label">Custom Contact Name (optional):</label>
          <input type="text" className="form-control" id="customName" value={customName} onChange={e => setCustomName(e.target.value)} placeholder="Leave empty for auto-generated name" />
        </div>
        <div className="d-flex gap-3 mb-4">
          <button type="submit" className="btn btn-primary flex-fill btn-generate">Generate Preview</button>
          <button type="button" className="btn btn-success flex-fill btn-download" onClick={handleDownload} disabled={!phoneNumber.trim()}>Download VCF</button>
        </div>
      </form>
      {showPreview && (
        <div className="preview card p-3" id="preview">
          <h3 className="card-title">Contact Preview:</h3>
          <div>{contactInfo}</div>
          <h4 className="vcf-content-title mt-4 mb-2">VCF Content:</h4>
          <pre>{vcfContent}</pre>
        </div>
      )}
    </div>
  );
};

export default VCFContactGenerator;
