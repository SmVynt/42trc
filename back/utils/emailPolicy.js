const allowedSchoolEmailDomains = () => {
    return process.env.ALLOWED_SCHOOL_EMAIL_DOMAINS
        ? process.env.ALLOWED_SCHOOL_EMAIL_DOMAINS.split(',')
        : ['42.fr', 'student.42.fr', 'student.42heilbronn.de'];
};

const getEmailDomain = (email = '') => {
    const atIndex = email.lastIndexOf('@');
    if (atIndex === -1) return '';
    return email.slice(atIndex + 1).trim().toLowerCase();
};

const isAllowedSchoolEmail = (email = '') => {
    const domain = getEmailDomain(email);
    if (!domain) return false;

	console.log('Checking email domain:', domain);
    return allowedSchoolEmailDomains().some((allowedDomain) => (
        domain === allowedDomain || domain.endsWith(`.${allowedDomain}`)
    ));
};

module.exports = {
    allowedSchoolEmailDomains,
    getEmailDomain,
    isAllowedSchoolEmail,
};
