export const SECTION_CONFIG = [
    {
        key: 'def',
        title: 'definicion',
        label: 'ESES',
        baseUrl: 'https://www.wordreference.com/definicion/',
        selector: '#otherDicts',
        hasSpellCheck: true
    },
    {
        key: 'sin',
        title: 'sinonimos',
        label: 'sinon',
        baseUrl: 'https://www.wordreference.com/sinonimos/',
        selector: '#article',
        hasSpellCheck: false
    },
    {
        key: 'spen',
        title: 'Esp►Eng',
        label: 'ESEN',
        baseUrl: 'https://www.wordreference.com/es/en/translation.asp?spen=',
        selector: '#articleWRD',
        hasSpellCheck: false
    },
    {
        key: 'rae',
        title: 'RAE def',
        label: 'RAE',
        baseUrl: 'https://dle.rae.es/',
        selector: '#resultados > article',
        hasSpellCheck: false
    },
    {
        key: 'con',
        title: 'conjugar',
        label: 'conjug',
        baseUrl: 'https://www.wordreference.com/conj/esverbs.aspx?v=',
        selector: '#contenttable > tbody > tr > td > table > tbody > tr > td:nth-child(2)',
        hasSpellCheck: false
    }
];