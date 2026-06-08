const allowedSchoolEmailDomains = (
    process.env.ALLOWED_SCHOOL_EMAIL_DOMAINS || '42.fr,student.42.fr,student.42heilbronn.de'
)
    .split(',')
    .map((domain) => domain.trim().toLowerCase())
    .filter(Boolean);

const getEmailDomain = (email = '') => {
    const atIndex = email.lastIndexOf('@');
    if (atIndex === -1) return '';
    return email.slice(atIndex + 1).trim().toLowerCase();
};

const isAllowedSchoolEmail = (email = '') => {
    const domain = getEmailDomain(email);
    if (!domain) return false;

    return allowedSchoolEmailDomains.some((allowedDomain) => (
        domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
    ));
};

module.exports = {
    allowedSchoolEmailDomains,
    getEmailDomain,
    isAllowedSchoolEmail,
};
